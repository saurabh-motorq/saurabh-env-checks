const { insertAlertIntoPg } = require("./pg-repo");
var config = require("./config");
const moment = require('moment');
const { environments } = require('../common/environments/index');

async function performEnrolledVehiclesDevicesCountCheck(database, context)
{
    for(const env of environments){
        var vehicleQuerySpec = {
            query: "select count(1) as count from c where c.enrollmentStatus='ENROLLED' and c.type='VEHICLE'"
        };
        var deviceQuerySpec = {
            query: "select count(1) as count from c where c.type='DEVICE' and c.vin!= null"
        };
        try{
            const container = database.container(config.collection.entitiesId);
            const { resources: vehicleCount} = await container.items.query(vehicleQuerySpec).fetchAll();
            const { resources: deviceCount} = await container.items.query(deviceQuerySpec).fetchAll();
            var diff=vehicleCount[0].count-deviceCount[0].count;
            if (vehicleCount === deviceCount) {
                    context.log('Same vehicles and devices count');
            } else {
                context.log('Different vehicles and devices count');
                await insertAlertIntoPg(env.name,'DIFFERENT_VEHICLES_AND_DEVICES_COUNT','Vehicle Count - Device Count ' + diff );
            }
        }
        catch(err){
            context.log(err);
            await insertAlertIntoPg(env,'DIFFERENT_VEHICLES_AND_DEVICES_COUNT', moment().toISOString, 'Check Failed');
        }
    }
}

module.exports = { performEnrolledVehiclesDevicesCountCheck };