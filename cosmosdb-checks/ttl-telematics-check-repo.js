const { insertAlertIntoPg } = require("./pg-repo");

async function performTTLTelematicsCheck(database, context, env)
{
    var querySpec = {
        query: "SELECT count(1) as count FROM c where (c.type='COMBINEDFEED' || c.type='TRIP' || c.type='EVENT') and (GetCurrentTimeStamp()/1000 - c._ts > c.ttl+ 172800) and c._ts<(GetCurrentTimeStamp()/1000 - 604800)"
    };

    try{
        const container = database.container(env.infra.cosmos.collection.telematicsId);
        const { resources: expiredReportCount} = await container.items.query(querySpec).fetchAll();
        if (expiredReportCount[0].count === 0) {
                context.log('No expired reports present in telematics collection');
        } else {
            context.log('Expired Reports Found');
            await insertAlertIntoPg(env.name,'COSMOS','TTL_TELEMATICS_CHECK',{expiredReportCount: expiredReportCount[0].count});
        }
    }
    catch(err){
        context.log(err);
        await insertAlertIntoPg(env.name,'COSMOS','TTL_TELEMATICS_CHECK', {details: 'check failed'});
    }
}

module.exports = { performTTLTelematicsCheck };