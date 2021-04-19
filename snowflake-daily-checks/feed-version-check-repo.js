const { insertAlertIntoPg } = require('./pg-repo');
const { environments } = require('../common/environments/index');
const config = require('./config');
const moment = require('moment');
const utility = require('./utility');

function getCurrentDayForMinusXHours(x) {
    let currentTime = moment();
    currentTime.subtract(x, "hours");
    const year = currentTime.year().toString();
    let month = currentTime.month() + 1;
    month = ('0' + month).slice(-2);
    let day = currentTime.date();
    day = ('0' + day).slice(-2);
    return {year, month, day};
}

function getSyncQueries(env) {
    const rawTableName = 'INIT_LOAD_MONITORING_FEED_VERSION_CHECK'
    const createCommand = `CREATE OR REPLACE TABLE INIT_LOAD_MONITORING_FEED_VERSION_CHECK(BODY VARIANT)`;
    const {year, month, day} = getCurrentDayForMinusXHours(24);
    const copyCommands = [];
    for(let i = 0; i < env.infra.snowflake.partitions; i++) {
        const query = `copy into ${rawTableName} from (select parse_json(HEX_DECODE_STRING($1:Body)) from @${env.infra.snowflake.stageName}/${i}/${year}/${month}/${day})`
        copyCommands.push(query);
    }
    const createTableCommands = [
        'CREATE OR REPLACE TABLE TELEMETRY_FEED_VER_CHECK(ID STRING, DEVICE_ID STRING, VEHICLE_ID STRING, FEED_VER FLOAT)',
        'CREATE OR REPLACE TABLE EVENT_FEED_VER_CHECK(ID STRING, DEVICE_ID STRING, VEHICLE_ID STRING, FEED_VER FLOAT)',
        'CREATE OR REPLACE TABLE TRIP_FEED_VER_CHECK(ID STRING, DEVICE_ID STRING, VEHICLE_ID STRING, FEED_VER FLOAT)'
    ]
    const telemetryInsertCommand =  `insert into TELEMETRY_FEED_VER_CHECK (ID, DEVICE_ID, VEHICLE_ID, FEED_VER)
         (select 
            T.body:id::STRING as id,
            T.body:dId::STRING as device_id,
            T.body:vId::STRING as vehicle_id,
            T.body:feed_ver::STRING as feed_ver
        from ${rawTableName} T where T.body:type='COMBINEDFEED' 
        and T.body:crankingVoltage is not null );`;


    const eventInsertCommand = `insert into EVENT_FEED_VER_CHECK (ID, VEHICLE_ID, DEVICE_ID, FEED_VER) (
        select
            T.body:id::STRING as id,
            T.body:vId::STRING as vehicle_id,
            T.body:dId::STRING as device_id,
            T.body:feed_ver::STRING as feed_ver
        from ${rawTableName} T where T.body:type='EVENT');`;

    const tripInsertCommand =  `insert into TRIP_FEED_VER_CHECK (ID, VEHICLE_ID, DEVICE_ID, FEED_VER) (
        select 
            T.body:id::STRING as id,
            T.body:vId::STRING as vehicle_id,
            T.body:dId::STRING as device_id,
            T.body:feed_ver::STRING as FEED_VER
        from ${rawTableName} T where T.body:type='TRIP');`;
    
    const tables = ['TELEMETRY_FEED_VER_CHECK', 'EVENT_FEED_VER_CHECK', 'TRIP_FEED_VER_CHECK'];
    const deduplicationQueries = [];
    for(const tableName of tables) {
        const queries = [
            `set srctable='${tableName}';`,
            `CREATE OR REPLACE TABLE motorq.motorq_qa.t_dedup as
            SELECT * FROM 
            (SELECT *, ROW_NUMBER() OVER (PARTITION BY ID order by ID) rowNum
            FROM identifier($srctable)) X
            WHERE rowNum=1;`,
            `drop table identifier($srctable);`,
            `alter table motorq.motorq_qa.t_dedup rename to identifier($srctable);`,
            `ALTER TABLE identifier($srctable) DROP COLUMN ROWNUM;`
        ]
        deduplicationQueries.push(...queries);
    }
    
    
    let queryList = [createCommand, ...copyCommands, ...createTableCommands, telemetryInsertCommand, eventInsertCommand, tripInsertCommand, ...deduplicationQueries];
    return queryList;
}

function getFeedVersionCheckQueries() {
   const queries = [
       `
       SELECT DISTINCT(VEHICLE_ID) FROM (
        WITH FEED_VER_COUNT AS (
        SELECT COUNT(*) as count, VEHICLE_ID, feed_ver FROM TELEMETRY_FEED_VER_CHECK WHERE FEED_VER IS NOT NULL GROUP BY feed_ver, VEHICLE_ID
        ) SELECT * FROM FEED_VER_COUNT WHERE count > 1)
        UNION
        SELECT DISTINCT(VEHICLE_ID) FROM (
        WITH FEED_VER_COUNT AS (
        SELECT COUNT(*) as count, VEHICLE_ID, feed_ver FROM EVENT_FEED_VER_CHECK WHERE FEED_VER IS NOT NULL GROUP BY feed_ver, VEHICLE_ID
        ) SELECT * FROM FEED_VER_COUNT WHERE count > 1)
        UNION
        SELECT DISTINCT(VEHICLE_ID) FROM (
        WITH FEED_VER_COUNT AS (
        SELECT COUNT(*) as count, VEHICLE_ID, feed_ver FROM TRIP_FEED_VER_CHECK WHERE FEED_VER IS NOT NULL GROUP BY feed_ver, VEHICLE_ID
        ) SELECT * FROM FEED_VER_COUNT WHERE count > 1);
        `
        ,
       `
       SELECT DISTINCT(DEVICE_ID) FROM (
        WITH FEED_VER_COUNT AS (
        SELECT COUNT(*) as count, DEVICE_ID, feed_ver FROM TELEMETRY_FEED_VER_CHECK WHERE FEED_VER IS NOT NULL GROUP BY feed_ver, DEVICE_ID
        ) SELECT * FROM FEED_VER_COUNT WHERE count > 1)
        UNION
        SELECT DISTINCT(DEVICE_ID) FROM (
        WITH FEED_VER_COUNT AS (
        SELECT COUNT(*) as count, DEVICE_ID, feed_ver FROM EVENT_FEED_VER_CHECK WHERE FEED_VER IS NOT NULL GROUP BY feed_ver, DEVICE_ID
        ) SELECT * FROM FEED_VER_COUNT WHERE count > 1)
        UNION
        SELECT DISTINCT(DEVICE_ID) FROM (
        WITH FEED_VER_COUNT AS (
        SELECT COUNT(*) as count, DEVICE_ID, feed_ver FROM TRIP_FEED_VER_CHECK WHERE FEED_VER IS NOT NULL GROUP BY feed_ver, DEVICE_ID
        ) SELECT * FROM FEED_VER_COUNT WHERE count > 1);
        `
   ]
   
   return queries;
}

async function performFeedVersionChecks(connection, context) {
    for(const env of environments) {
        if(env.infra.snowflake) {
            try{
                const tablePrepQueries = getSyncQueries(env);
                const feedVersionCheckQueries = getFeedVersionCheckQueries();
                for (const query of tablePrepQueries) {
                    await utility.executeCommand(context, connection, query);
                }
                const vehicles = await utility.executeCommand(context, connection, feedVersionCheckQueries[0]);
                const devices = await utility.executeCommand(context, connection, feedVersionCheckQueries[1]);
                if(vehicles.length || devices.length) {
                    await insertAlertIntoPg(env.name, 'FEED_VERSION_RESET', {vehicles: vehicles.map(item => item.VEHICLE_ID), devices: devices.map(item => item.DEVICE_ID)});
                }
            } catch(err) {
                context.log(err);
                await insertAlertIntoPg(env.name, 'FEED_VERSION_RESET', {details: 'FEED_VERSION_CHECK_FAILED'});
            }
        }
    }
}

module.exports = { performFeedVersionChecks };