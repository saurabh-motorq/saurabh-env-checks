const { insertAlertIntoPg } = require("./pg-repo");
var config = require("./config");
const moment = require('moment');
const { environments } = require('../common/environments/index');

async function performVehiclesWithMultipleDevicesCountCheck(database, context)
{
    for(const env of environments){
        var querySpec = {
            query: "select count(1) as count from c where c.type='VEHICLE' and ARRAY_LENGTH(c.deviceIds)>=2"
        };
        try{
            const container = database.container(config.collection.entitiesId);
            const { resources: vehicleCount} = await container.items.query(querySpec).fetchAll();
            context.log(vehicleCount[0]);
            if (vehicleCount[0].count === 0) {
                    context.log('No vehicles with multiple devices');
            } else {
                context.log('Vehicles with multiple devices found');
                await insertAlertIntoPg(env.name,'VEHICLES_WITH_MULTIPLE_DEVICES_COUNT', 'number of vehicles with multiple devices ' + vehicleCount[0].count);
            }
        }
        catch(err){
            context.log(err);
            await insertAlertIntoPg(env,'VEHICLES_WITH_MULTIPLE_DEVICES_COUNT', moment().toISOString, 'Check Failed');
        }
    }
}

module.exports = { performVehiclesWithMultipleDevicesCountCheck };