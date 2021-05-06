const { insertAlertIntoPg } = require("./pg-repo");

async function performNullVinCheck(database, context, env)
{
    var querySpec = {
        query: "select count(1) as count from c where c.type='VEHICLE' and c.vin=null"
    };

    try{
        const container = database.container(env.infra.cosmos.collection.entitiesId);
        const { resources: vehicleCount} = await container.items.query(querySpec).fetchAll();
        if (vehicleCount[0].count === 0) {
                context.log('No vehicle with null vin found');
        } else {
            context.log('Vehicles with null vin found');
            await insertAlertIntoPg(env.name,'COSMOS','VEHICLES_WITH_NULL_VIN',{vechicleCount: vehicleCount[0].count});
        }
    }
    catch(err){
        context.log(err);
        await insertAlertIntoPg(env.name,'COSMOS','VEHICLES_WITH_NULL_VIN', {details: 'check failed'});
    }
}

module.exports = { performNullVinCheck };