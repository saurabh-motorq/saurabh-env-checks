
const pgRepo = require('./pg-repo')
async function performLatestEventCountCheck(context,clientPgdb,env)
{
    const eventFeed = env.infra.pg.tables.eventFeed;
    var eventQuerySpec = {
        query: `SELECT count(*) AS count FROM ${eventFeed} WHERE event_timestamp > now() - interval '1 day'`
    };
    try{
        const tripCount = await clientPgdb.query(eventQuerySpec.query);
        if (tripCount.rows[0].count>0) {
                context.log('events found in last 24 hrs');
        } else {
            context.log('No event found in the last day');
            await pgRepo.insertAlertIntoPg(env.name,'EVENTS_COUNT_IN_POSTGRES',{details: 'no events found in the last 24 hours'});
        }
    }
    catch(err){
        context.log(err);
        await pgRepo.insertAlertIntoPg(env.name,'EVENTS_COUNT_IN_POSTGRES', {details: 'Check Failed'});
    }
}

module.exports = { performLatestEventCountCheck };