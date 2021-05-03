const { insertAlertIntoPg } = require("./pg-repo");
var config = require("./config");
const { environments } = require('../common/environments/index');

async function performVehiclesWithMultipleDevicesCountCheck(database, context, env)
{
    var querySpec = {
        query: "select count(1) as count from c where c.type='VEHICLE' and ARRAY_LENGTH(c.deviceIds)>=2"
    };
    try{
        const container = database.container(env.infra.cosmos.collection.entitiesId);
        const { resources: vehicleCount} = await container.items.query(querySpec).fetchAll();
        if (vehicleCount[0].count === 0) {
                context.log('No vehicles with multiple devices');
        } else {
            context.log('Vehicles with multiple devices found');
            await insertAlertIntoPg(env.name,'VEHICLES_WITH_MULTIPLE_DEVICES_COUNT', {vehicleCount: vehicleCount[0].count});
        }
    }
    catch(err){
        context.log(err);
        await insertAlertIntoPg(env.name,'VEHICLES_WITH_MULTIPLE_DEVICES_COUNT', {details:'Check Failed'});
    }
}

module.exports = { performVehiclesWithMultipleDevicesCountCheck };