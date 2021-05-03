const pgRepo = require('./pg-repo');

async function performLatestTripCountCheck(context,clientPgdb,env)
{
    const tripFeed = env.infra.pg.tables.tripFeed;
    var tripQuerySpec = {
        query: `SELECT count(*) AS count FROM ${tripFeed} WHERE endtimestamp > now() - interval '1 day'`
    };
    try{
        const tripCount = await clientPgdb.query(tripQuerySpec.query);
        if (tripCount.rows[0].count>0) {
                context.log('trips found in last 24 hrs');
        } else {
            context.log('No trips found in the last day');
            await pgRepo.insertAlertIntoPg(env.name,'TRIPS_COUNT_IN_POSTGRES',{details: 'no trips found in the last 24 hours'});
        }
    }
    catch(err){
        context.log(err);
        await pgRepo.insertAlertIntoPg(env.name,'TRIPS_COUNT_IN_POSTGRES', {details: 'Check Failed'});
    }
}

module.exports = { performLatestTripCountCheck };