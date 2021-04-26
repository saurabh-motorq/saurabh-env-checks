const { insertAlertIntoPg } = require("./pg-repo");

async function performTTLReferenceDataCheck(database, context, env)
{
    var querySpec = {
        query: "SELECT count(1) as count FROM c where TimestampToDateTime(c._ts*1000)>DateTimeAdd('day',-7,GetCurrentDateTime()) and DateTimeDiff('day',TimestampToDateTime((c._ts + c.ttl)*1000),GetCurrentDateTime())>2"
    };

    try{
        const container = database.container(env.infra.cosmos.collection.referenceDataId);
        const { resources: expiredReportCount} = await container.items.query(querySpec).fetchAll();
        if (expiredReportCount[0].count === 0) {
                context.log('No expired reports present in reference-data collection');
        } else {
            context.log('Expired Reports Found');
            await insertAlertIntoPg(env.name,'TTL_REFERENCE_DATA_CHECK','Number of expired reports found in reference_data with timestamp before last seven days ' + expiredReportCount[0].count);
        }
    }
    catch(err){
        context.log(err);
        await insertAlertIntoPg(env.name,'TTL_REFERENCE_DATA_CHECK', 'Ttl reference_data functioning check for reports having timestamp before last seven days failed');
    }
}

module.exports = { performTTLReferenceDataCheck };