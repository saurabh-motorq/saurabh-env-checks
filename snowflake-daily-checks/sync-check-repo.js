const { insertAlertIntoPg } = require('./pg-repo');
const { environments } = require('../common/environments/index');
const utility = require('./utility');
const moment = require('moment');
const config = require('./config');

function shouldSendSyncAlert(lastSyncEpoch) {
    const currentEpoch = moment().unix();
    return (currentEpoch - lastSyncEpoch) > config.SyncThresholdInSeconds;
}

async function raiseSyncAlerts(context, syncResults) {
    for(const result of syncResults) {
        const lastTripSyncEpoch = moment(result.LASTSYNC_TRIPS_TS).unix();
        const lastEventSyncEpoch = moment(result.LASTSYNC_EVENTS_TS).unix();
        const lastTelemetrySyncEpoch = moment(result.LASTSYNC_TELEMETRY_TS).unix();

        const environment = `${result.CUSTOMER_NAME}-${result.SCHEMA_TYPE}`;

        if(shouldSendSyncAlert(lastTelemetrySyncEpoch)) {
            const details = {lastSyncTime:  moment(result.LASTSYNC_TELEMETRY_TS).toISOString()}
            await insertAlertIntoPg(result.CUSTOMER_NAME, "SNOWFLAKE_TELEMETRY_SYNC_LAG" ,{type: "Snowflake telemetry not syncing", details })
        }

        if(shouldSendSyncAlert(lastEventSyncEpoch)) {
            const details = {lastSyncTime:  moment(result.LASTSYNC_EVENTS_TS).toISOString()};
            await insertAlertIntoPg(result.CUSTOMER_NAME, "SNOWFLAKE_EVENT_SYNC_LAG" ,{type: "Snowflake events not syncing", details })
        }

        if(shouldSendSyncAlert(lastTripSyncEpoch)) {
            const details = {lastSyncTime:  moment(result.LASTSYNC_TRIPS_TS).toISOString()};
            await insertAlertIntoPg(result.CUSTOMER_NAME, "SNOWFLAKE_TRIP_SYNC_LAG" ,{type: "Snowflake trip not syncing", details })
        }
    
    }
}

async function performSyncChecks(connection, context) {
    let query = '';
    for(const env of environments) {
        if(env.infra.snowflake) {
            if(query != ''){
                query += 'UNION';
            }
            const timestampFieldName = env.infra.snowflake.tableVersion == 'v3' ? 'TIMESTAMP' : 'TS_SRC';
            const tripEndTimestampFieldName = env.infra.snowflake.tableVersion == 'v3' ? 'END_TIMESTAMP' : 'TS_END'
            query += 
            `   SELECT
                '${env.name}' as CUSTOMER_NAME,'${env.infra.snowflake.tableVersion}' as SCHEMA_TYPE,
                (select top 1 ${timestampFieldName} from ${env.infra.snowflake.eventsTable} order by ${timestampFieldName} desc) as lastsync_events_ts,
                (select top 1 ${timestampFieldName} from ${env.infra.snowflake.telemetryTable} order by ${timestampFieldName} desc) as lastsync_telemetry_ts,
                (select top 1 ${tripEndTimestampFieldName} from ${env.infra.snowflake.tripsTable} order by ${tripEndTimestampFieldName} desc) as lastsync_trips_ts;
                
           `
        }
    }
    try{
        const results = await querySnowflake(connection, context, query);
        await raiseSyncAlerts(context, results);
    } catch(err) {
        const details = {properties: 'SNOWFLAKE_SYNC_CHECK_FAILED', timestamp: moment().toISOString()}
        await insertAlertIntoPg('COMMON', "SNOWFLAKE_SYNC_CHECK", details);
    }
}


async function querySnowflake(connection, context, query) {
    const results = await utility.executeCommand(context, connection, query);
    return results;
}

module.exports = { performSyncChecks };