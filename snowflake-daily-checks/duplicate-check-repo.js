const { insertAlertIntoPg } = require('./pg-repo');
const { environments } = require('../common/environments/index');
const config = require('./config');
const moment = require('moment');
const utility = require('./utility');

function getQuery(env) {
    const timestampFieldName = env.infra.snowflake.tableVersion == 'v3' ? 'TIMESTAMP' : 'TS_SRC';
    const eventSubTypeFieldName = env.infra.snowflake.tableVersion == 'v3' ? 'NAME' : 'E_STYPE';
    const vehicleIdFieldName = env.infra.snowflake.tableVersion == 'v3' ? 'VEHICLE_ID' : 'VID';    
    const descriptionFieldName = env.infra.snowflake.tableVersion == 'v3' ? 'DESCRIPTION': 'DESC';
    const query = 
        `
        SELECT DISTINCT(EVENT_SUBTYPE) as EVENT_TYPE FROM (
            SELECT ${vehicleIdFieldName} as VEHICLE_ID, ${eventSubTypeFieldName} as EVENT_SUBTYPE, ${timestampFieldName} as TIMESTAMP, VALUE, THRESHOLD, 
            CODE, ${descriptionFieldName} as DESCRIPTION, COUNT(DISTINCT(ID)) as COUNT
            FROM ${env.infra.snowflake.eventsTable}
            WHERE TIMESTAMP > '${moment().subtract(24, "hours").toISOString()}'
            GROUP BY VEHICLE_ID, EVENT_SUBTYPE, TIMESTAMP, VALUE, THRESHOLD, CODE, DESCRIPTION
            HAVING COUNT > 1
        )
        `
    return query;
}

async function performDuplicateChecks(connection, context) {
    for(const env of environments) {
        if(env.infra.snowflake) {
            try{
                const query = getQuery(env);
                const results = await querySnowflake(connection, context, query);
                const eventsWithDuplicates = results.map(item => item.EVENT_TYPE);
                if(eventsWithDuplicates.length) {
                    await insertAlertIntoPg(env.name, 'EVENT_DUPLICATE_ANOMALY', {eventsWithDuplicates});
                }
            } catch(err) {
                context.log(JSON.stringify(err));
                await insertAlertIntoPg(env.name, 'EVENT_DUPLICATE_ANOMALY', {details: 'EVENT_DUPLICATE_CHECK_FAILED'})
            }
        }
    }
}


async function querySnowflake(connection, context, query) {
    const results = await utility.executeCommand(context, connection, query);
    return results;
}

module.exports = { performDuplicateChecks };