const { insertAlertIntoPg } = require('./pg-repo');
const { environments } = require('../common/environments/index');
const config = require('./config');
const moment = require('moment');
const utility = require('./utility');

function getQueries(env) {
    const timestampFieldName = env.infra.snowflake.tableVersion == 'v3' ? 'TIMESTAMP' : 'TS_SRC';
    const tripEndTimestampFieldName = env.infra.snowflake.tableVersion == 'v3' ? 'END_TIMESTAMP' : 'TS_END';    
    const queries = [
        `
        SELECT DATE(${timestampFieldName}) as date, COUNT(*) as COUNT, 'TELEMETRY' as TYPE
        FROM ${env.infra.snowflake.telemetryTable} 
        WHERE ${timestampFieldName} > '${moment().subtract(24 * 30, "hours").toISOString()}' 
        GROUP BY date ORDER BY date desc LIMIT 30;
        `,
        `
        SELECT DATE(${timestampFieldName}) as date, COUNT(*) as COUNT, 'EVENTS' as TYPE
        FROM ${env.infra.snowflake.eventsTable}
        WHERE ${timestampFieldName} > '${moment().subtract(24 * 30, "hours").toISOString()}'
        GROUP BY date ORDER BY date desc LIMIT 30;
        `,
        `
        SELECT DATE(${tripEndTimestampFieldName}) as date, COUNT(*) as COUNT, 'TRIPS' as TYPE
        FROM ${env.infra.snowflake.tripsTable}
        WHERE ${tripEndTimestampFieldName} > '${moment().subtract(24 * 30, "hours").toISOString()}'
        GROUP BY date ORDER BY date desc LIMIT 30;
        `
    ]
    return queries;
}

async function performVolumeChecks(connection, context) {
    for(const env of environments) {
        if(env.infra.snowflake) {
            try{
                const queries = getQueries(env);
                const results = [];
                for(const query of queries) {
                    results.push(await querySnowflake(connection, context, query));
                }
                for(const result of results) {
                    //Ignore current day's data
                    const data = result.slice(1,);
                    const mappings = ['Sunday', 'Weekday', 'Weekday', 'Weekday', 'Weekday', 'Weekday', 'Saturday']
                    let currentDayOfWeek = moment(data[0].DATE).day();
                    let countSum = 0, dayCount = 0;
                    for(let i = 1; i < data.length; i++) {
                        if(mappings[moment(data[i].DATE).day()] == mappings[currentDayOfWeek]) {
                            countSum += data[i].COUNT
                            dayCount++;
                        }
                    }
                    let expectedAverage = 1.0 * countSum / dayCount;
                    if(Math.abs(data[0].COUNT - expectedAverage) * 100 / expectedAverage > config.volumeCheckMaxDiffThreshold) {
                        await insertAlertIntoPg(env.name, `${data[0].TYPE}-VOLUME-ANOMALY`, {expectedVolume: expectedAverage, actualVolume: data[0].COUNT});
                    }
                }
            } catch(err) {
                await insertAlertIntoPg(env.name, `VOLUME-ANOMALY`, {details: 'SNOWFLAKE_VOLUME_CHECK_FAILED'});
            }
        }
    }
}


async function querySnowflake(connection, context, query) {
    const results = await utility.executeCommand(context, connection, query);
    return results;
}

module.exports = { performVolumeChecks };