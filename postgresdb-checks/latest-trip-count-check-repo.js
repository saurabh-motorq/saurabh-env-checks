var config = require("./config");
const { environments } = require('../common/environments/index');
const pgRepo = require('./pg-repo')
async function performLatestTripCountCheck(context)
{
    for(const env of environments){
        const tripFeed = config.pgTables.tripFeed;
        var tripQuerySpec = {
            query: `SELECT count(*) AS count FROM ${tripFeed} WHERE endtimestamp > now() - interval '1 day'`
        };
        try{
            const tripCount = await pgRepo.queryPG(tripQuerySpec.query);
            context.log(tripCount.rows[0].count);
            if (tripCount.rows[0].count>0) {
                    context.log('trips found in last 24 hrs');
            } else {
                context.log('No trips found in the last day');
                await pgRepo.insertAlertIntoPg(env.name,'TRIP_COUNTS_IN_POSTGRES','no trips found in the last 24 hours' );
            }
        }
        catch(err){
            context.log(err);
            await pgRepo.insertAlertIntoPg(env.name,'TRIP_COUNTS_IN_POSTGRES', 'Check Failed');
        }
    }
}

module.exports = { performLatestTripCountCheck };