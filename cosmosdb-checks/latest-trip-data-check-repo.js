const { insertAlertIntoPg } = require("./pg-repo");

async function performLatestTripDataCheck(database, context, env)
{
    var querySpec = {
        query: "Select count(1) as count from c where c.type='TRIP' and c.ts_start > DateTimeAdd('DD',-1,GetCurrentDateTime())"
    };

    try{
        const container = database.container(env.infra.cosmos.collection.telematicsId);
        const { resources: tripCount} = await container.items.query(querySpec).fetchAll();
        if (tripCount[0].count !== 0) {
                context.log('Trips found in last one day');
        } else {
            context.log('No trips found');
            await insertAlertIntoPg(env.name,'COSMOS','TRIPS_IN_LAST_DAY',{details: 'no trips found in last one day'});
        }
    }
    catch(err){
        context.log(err);
        await insertAlertIntoPg(env.name,'COSMOS','TRIPS_IN_LAST_DAY', {details: 'check failed'});
    }
}

module.exports = { performLatestTripDataCheck };