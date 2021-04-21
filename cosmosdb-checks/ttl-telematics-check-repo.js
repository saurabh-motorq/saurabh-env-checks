const { insertAlertIntoPg } = require("./pg-repo");
var config = require("./config");
const { environments } = require('../common/environments/index');
async function performTTLTelematicsCheck(database, context)
{
    for(const env of environments) {
        var querySpec = {
            query: "SELECT count(1) as count FROM c where (GetCurrentTimeStamp()/1000 - c._ts > c.ttl+ 172800) and c._ts<(GetCurrentTimeStamp()/1000 - 604800)"
        };

        try{
            const container = database.container(config.collection.telematicsId);
            const { resources: expiredReportCount} = await container.items.query(querySpec).fetchAll();
            // context.log(vehicleCount[0].count);
            if (expiredReportCount[0].count === 0) {
                    context.log('No expired reports present in telematics collection');
            } else {
                context.log('Expired Reports Found');
                await insertAlertIntoPg(env.name,'TTL_TELEMATICS_CHECK','Number of expired reports found in telematics with timestamp before last seven days ' + expiredReportCount[0].count);
            }
        }
        catch(err){
            context.log(err);
            await insertAlertIntoPg(env.name,'TTL_TELEMATICS_CHECK', 'Ttl telematics functioning check for report having timestamp before last seven days failed');
        }
    }
}

module.exports = { performTTLTelematicsCheck };