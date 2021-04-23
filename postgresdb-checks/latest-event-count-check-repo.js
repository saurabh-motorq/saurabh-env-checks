var config = require("./config");
const { environments } = require('../common/environments/index');
const pgRepo = require('./pg-repo')
async function performLatestEventCountCheck(context)
{
    for(const env of environments){
        const eventFeed = config.pgTables.eventFeed;
        var eventQuerySpec = {
            query: `SELECT count(*) AS count FROM ${eventFeed} WHERE event_timestamp > now() - interval '1 day'`
        };
        try{
            const tripCount = await pgRepo.queryPG(eventQuerySpec.query);
            if (tripCount.rows[0].count>0) {
                    context.log('events found in last 24 hrs');
            } else {
                context.log('No event found in the last day');
                await pgRepo.insertAlertIntoPg(env.name,'EVENT_COUNTS_IN_POSTGRES','no events found in the last 24 hours' );
            }
        }
        catch(err){
            context.log(err);
            await pgRepo.insertAlertIntoPg(env.name,'EVENT_COUNTS_IN_POSTGRES', 'Check Failed');
        }
    }
}

module.exports = { performLatestEventCountCheck };