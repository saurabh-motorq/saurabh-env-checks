const snowflake = require('snowflake-sdk');
const utility = require('./utility');
const moment  = require('moment');
let rp = require('request-promise');
const config = require('./config');
const queryGenerator = require('./queries');
const  { DataStore } = require("./data-store");

require('dotenv').config()


function raisePagerDutyTrigger(parsedResult, environment, type,  context) {
    context.log('sending pager duty trigger');
    context.log(parsedResult);
    let details = {
        details: parsedResult
    }
    let uri = 'https://events.pagerduty.com/generic/2010-04-15/create_event.json';
    let service_key = config.pagerDutyCriticalKey;
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


async function initSnowflakeClient(context, schema, database) {
    const connection = snowflake.createConnection({
        account: config.account,
        username: config.username,
        password: config.password,
        database: database,
        schema: schema,
        warehouse: 'MOTORQ_UTEST',
        role: 'SYSADMIN'
    });

    await connection.connect(function (err, conn) {
        if (err) {
            context.error('Unable to connect: ' + err.message);
            throw err;
        } else {
            context.log('Successfully connected as id: ' + connection.getId());
        }
    });

    return connection
}

module.exports = {abcfunc: async function (context, myTimer) {
    
    context=console;
    const entitityTypes = [
        {
            type: "DEVICE",
            tableName: "DEVICES"
        },
        {
            type: "VEHICLE",
            tableName: "VEHICLES"
        },
        {
            type: "ACCOUNT",
            tableName: "ACCOUNTS"
        },
        {
            type: "ENROLLMENT",
            tableName: "ENROLLMENTS"
        }
    ]

    const environments = config.environmentConfigs;
    for(const env of environments){
        const connection = await initSnowflakeClient(context, env.snowflake.schema, env.snowflake.database);
        const dataStore = new DataStore(env.cosmos.endpoint, env.cosmos.primaryKey, env.cosmos.database, env.cosmos.entitiesId);
        const tableNames = entitityTypes.map(item => item.tableName)
        const query = queryGenerator.getMaxTimestampForEntities(tableNames);
        const maxTimestampsInSnowflake = await utility.executeCommand(context, connection, query);        
        
        
        for(let i = 0; i < entitityTypes.length; i++) {
            const syncCheckTimestamp = moment().subtract(config.SyncThresholdInSeconds, "seconds").unix();
            const snowflakeMaxTimestamp = parseInt(maxTimestampsInSnowflake[i].MAX_UPDATED_TIMESTAMP);
            const maxTimestampInCosmosWithinThreshold = await dataStore.getMaxTimestampLessThanGivenTimestamp(entitityTypes[i].type, syncCheckTimestamp);
            
            if(!maxTimestampInCosmosWithinThreshold || !snowflakeMaxTimestamp || snowflakeMaxTimestamp < maxTimestampInCosmosWithinThreshold) {
                const details = {lastUpdatedTimestamp: snowflakeMaxTimestamp, expectedTimestamp: maxTimestampInCosmosWithinThreshold};
                raisePagerDutyTrigger(details, env.envName, entitityTypes[i].tableName, context);
            }            
        }
    }

    context.log('COMPLETED SNOWFLAKE ENTITY SYNC CHECK');

}}
