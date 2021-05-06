const { insertAlertIntoPg } = require("./pg-repo");

async function performEnrolledVehiclesDevicesCountCheck(database, context, env)
{
    var vehicleQuerySpec = {
        query: "select count(1) as count from c where c.enrollmentStatus='ENROLLED' and c.type='VEHICLE'"
    };
    var deviceQuerySpec = {
        query: "select count(1) as count from c where c.type='DEVICE' and c.vin!= null"
    };
    try{
        const container = database.container(env.infra.cosmos.collection.entitiesId);
        const { resources: vehicleCount} = await container.items.query(vehicleQuerySpec).fetchAll();
        const { resources: deviceCount} = await container.items.query(deviceQuerySpec).fetchAll();
        var diff=vehicleCount[0].count-deviceCount[0].count;
        if (diff === 0) {
                context.log('Same vehicles and devices count');
        } else {
            context.log('Different vehicles and devices count');
            await insertAlertIntoPg(env.name,'COSMOS','DIFFERENT_VEHICLES_AND_DEVICES_COUNT',{vehicleDeviceCountDiff: diff });
        }
    }
    catch(err){
        context.log(err);
        await insertAlertIntoPg(env.name,'COSMOS','DIFFERENT_VEHICLES_AND_DEVICES_COUNT', {details: 'Check Failed'});
    }
}

module.exports = { performEnrolledVehiclesDevicesCountCheck };