const snowflake = require('snowflake-sdk');
const queryGenerator = require('./queries');
const utility = require('./utility');
const moment  = require('moment');
let rp = require('request-promise');
const config = require('./config');
require('dotenv').config()

async function getLatestSyncTimestamps(context) {
    const connection = snowflake.createConnection({
        account: config.account,
        username: config.username,
        password: config.password,
        database: 'MOTORQ',
        schema: 'MOTORQ_STAGE',
        warehouse: 'MOTORQ_UTEST',
        role: 'SYSADMIN'
    });

    const syncQuery = queryGenerator.getLatestSyncQuery();

    await connection.connect(function (err, conn) {
        if (err) {
            context.error('Unable to connect: ' + err.message);
            throw err;
        } else {
            context.log('Successfully connected as id: ' + connection.getId());
        }
    });

    const results = await utility.executeCommand(context, connection, syncQuery);

    return results;
}

function shouldSendSyncAlert(lastSyncEpoch) {
    const currentEpoch = moment().unix();
    return (currentEpoch - lastSyncEpoch) > config.SyncThresholdInSeconds;
}


function raisePagerDutyTrigger(parsedResult, environment, type,  context) {
    context.log('sending pager duty trigger');
    context.log(parsedResult);
    let details = {
        details: parsedResult
    }
    let uri = 'https://events.pagerduty.com/generic/2010-04-15/create_event.json';
    let service_key = config.pagerDutyNonCriticalKey;
    let options = {
        method: 'POST',
        uri,
        body: {
            service_key,
            event_type: 'trigger',
            description: `Snowflake ${type} data for ${environment} is not being synced`,
            incident_key: `snowflake-${type}-sync-stopped-${environment} `,
            details: details
        },
        json: true
    };
    rp(options);
}


module.exports = async function (context, myTimer) {
    const latestSyncResults = await getLatestSyncTimestamps(context);

    for(const result of latestSyncResults) {
        const lastTripSyncEpoch = moment(result.LASTSYNC_TRIPS_TS).unix();
        const lastEventSyncEpoch = moment(result.LASTSYNC_EVENTS_TS).unix();
        const lastTelemetrySyncEpoch = moment(result.LASTSYNC_TELEMETRY_TS).unix();

        const environment = `${result.CUSTOMER_NAME}-${result.ENV_TYPE}-${result.SCHEMA_TYPE}`;

         if(shouldSendSyncAlert(lastTelemetrySyncEpoch)) {
             const details = {lastSyncTime:  moment(result.LASTSYNC_TELEMETRY_TS).toISOString()}
             const type = 'TELEMETRY';
             raisePagerDutyTrigger(details, environment, type, context);
         }

         if(shouldSendSyncAlert(lastEventSyncEpoch)) {
            const details = {lastSyncTime:  moment(result.LASTSYNC_EVENTS_TS).toISOString()};
            const type = 'EVENTS';
            raisePagerDutyTrigger(details, environment, type, context);
         }

         if(shouldSendSyncAlert(lastTripSyncEpoch)) {
            const details = {lastSyncTime:  moment(result.LASTSYNC_TRIPS_TS).toISOString()};
            const type = 'TRIPS';
            raisePagerDutyTrigger(details, environment, type, context);
         }
    
    }

}
