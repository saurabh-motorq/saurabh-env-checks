const { environments } = require('../common/environments');
const _ = require('lodash');
const { CosmosClient } = require("@azure/cosmos");
const Handlebars = require("handlebars");
const fs = require('fs');
const alerter = require('../common/alerter');
const path = require('path');

async function main(context, _req) {
    const results = [];
    for (const env of environments) {
        context.log('validating for ', env.name)
        const result = await validateAssertions(env);
        results.push(result);
    }
    const html = formatResult(results);
    context.log(html);
    await alerter.sendMail("System assertions", html);

    context.log('Completed');
}

async function validateAssertions(env) {
    try {
        const client = new CosmosClient({
            endpoint: env.infra.cosmos.endpoint,
            key: env.infra.cosmos.key
        });

        const telematicsContainer = client.database(env.infra.cosmos.db).container(env.infra.cosmos.telematicsId);
        const dpsResult = await telematicsContainer.items.query(`SELECT c.id, c.dId,c.max_feed_ver  FROM c WHERE c.type ='DEVICEPROCESSINGSTATE'`).fetchAll();
        dpsList = dpsResult.resources;
        const groupedByDId = _.groupBy(dpsList, 'dId');
        const multipleDps = [];
        for (const [dId, ids] of Object.entries(groupedByDId)) {
            if (ids.length > 1) {
                multipleDps.push(dId);
            }
        }

        const entitiesContainer = client.database(env.infra.cosmos.db).container(env.infra.cosmos.entitiesId);
        const vehiclesResult = await entitiesContainer.items.
            query(`SELECT * FROM c WHERE c.type='VEHICLE' and c.dId = null`).
            fetchAll();

        const vehicles = vehiclesResult.resources.filter(vehicle => vehicle.enrollmentStatus == "ENROLLED");
        const vehiclesWithMultipleDevices = vehicles.filter(vehicle => vehicle.deviceIds && vehicle.deviceIds.length > 1);
        const vehiclesWithNoOrInvalidVin = vehicles.filter(vehicle => _.isNil(vehicle.vin) || vehicle.vin.length != 17);
        const vehiclesWithNoDataSource = vehicles.filter(vehicle => _.isNil(vehicle.dataSource));
        const vehiclesWithNoDefaultDeviceVersion = vehicles.filter(vehicle => _.isNil(vehicle.default_device_version));
        const vehiclesWithDefaultVersionGreaterThanDpsMax = vehicles.filter(
            vehicle => vehicle.default_device_version &&
                dpsList.some(
                    dps => dps.vId = vehicle.id
                        && vehicle.deviceIds.includes(dps.dId)
                        && (_.isNil(dps.max_feed_ver)
                            || vehicle.default_device_version > dps.max_feed_ver.TRIP
                            || vehicle.default_device_version > dps.max_feed_ver.EVENT
                            || vehicle.default_device_version > dps.max_feed_ver.COMBINEDFEED)
                ))

        return {
            environmentName: env.name,
            monitoringFailed: false,
            multipleDps,
            vehiclesWithMultipleDevices,
            vehiclesWithNoOrInvalidVin,
            vehiclesWithNoDataSource,
            vehiclesWithNoDefaultDeviceVersion,
            vehiclesWithDefaultVersionGreaterThanDpsMax
        }
    } catch (error) {
        return {
            environmentName: env.name,
            monitoringFailed: true,
            error: error
        }
    }
}

function formatResult(results) {
    const template = Handlebars.compile(fs.readFileSync(path.join(__dirname, 'email-alert.html'), 'utf-8'));
    return template(results);
}

module.exports = main

//main(console);