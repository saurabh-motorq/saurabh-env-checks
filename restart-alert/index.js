let config = require('./config');
let rp = require('request-promise');
let { environments } = require('../common/environments')

module.exports = async function (context) {
    context.log('Starting Restart Alert');
    for (let environment of environments) {
        context.log(environment.name)
        let options = constructAppinsightsQueryWithParams(environment, context);
        let appinsightsResults = await rp(options);
        let parsedResult = parseappInsightResults(appinsightsResults, context);
        if (parsedResult.length) {
            raisePagerDutyTrigger(parsedResult,
                environment.infra.pager.criticalKey,
                `High Restarts for past ${config.timespan}`,
                environment.name);
        }
    }
};

function constructAppinsightsQueryWithParams(environment, context) {
    let appId = environment.infra.ai.id;
    let apiKey = environment.infra.ai.key;
    let uri = 'https://api.applicationinsights.io/v1/apps/' + appId + '/query';
    let query = `customEvents | where name contains 'Application started' `;
    query += `| where timestamp  > ago(${config.timespan}) `;
    query += `| summarize count() by cloud_RoleName, appName `;
    context.log(query)
    let options = {
        uri: uri,
        qs: {
            query
        },
        headers: {
            'x-api-key': apiKey
        },
        json: true
    };
    return options;
}

function parseappInsightResults(results, context) {
    let parsedResult = [];
    for (let row of results.tables[0].rows) {
        if (row.length && row[2] > config.restartLimit) {
            parsedResult.push({ name: row[0], restartCount: row[2] })
        }
    }
    return parsedResult;
}

async function raisePagerDutyTrigger(parsedResult, pagerDutyCriticalKey, pagerMessage, source) {
    config.context.log('sending pager duty trigger');
    let details = { details: parsedResult }
    let uri = 'https://events.pagerduty.com/v2/enqueue';
    let routing_key = pagerDutyCriticalKey;
    const payload = {
        summary: pagerMessage,
        severity: 'critical',
        custom_details: details,
        source: source
    }
    let options = {
        method: 'POST',
        uri,
        body: {
            routing_key,
            event_action: 'trigger',
            dedup_key: "Hight Restarts",
            payload
        },
        json: true
    };
    await rp(options);
}
