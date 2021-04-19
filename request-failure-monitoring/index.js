let config = require('./config');
let rp = require('request-promise');
const moment = require('moment');
const _ = require('lodash');

module.exports = async function (context, myTimer) {
    config.context = context;
    context.log('Starting request failure Monitoring : ' + moment().toISOString());
    const envs = config.envs;
    const results = [];
    for(let env of envs){
        let options = constructAppinsightsQueryWithParams(env);
        let appinsightsResults = await rp(options);
        let parsedResult = parseappInsightResults(appinsightsResults);
        if(parsedResult>env.count)
        results.push({
            name : env.name,
            failureCount : parsedResult
        })
    }
    if(shouldSendAlert(results)){
        raisePagerDutyTrigger(results);
    }
};

function constructAppinsightsQueryWithParams(env) {
    let appId = env.appId;
    let apiKey = env.key;
    let uri = 'https://api.applicationinsights.io/v1/apps/' + appId + '/query';
    let query = constructQuery();
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

function constructQuery() {
    let query = `requests | where timestamp > ago(${config.timespan})  `;
    query += `| where success == false `;
    query+= ` | where toint(resultCode)>=500`
    query += `| summarize count() `;
    return query;
}

function parseappInsightResults(results) {
    return results.tables[0].rows[0][0]
}

function shouldSendAlert(results){
    return results.length>0
}

function raisePagerDutyTrigger(parsedResult){
    config.context.log('sending pager duty trigger');
    let details = {details:parsedResult}
    let uri = 'https://events.pagerduty.com/generic/2010-04-15/create_event.json';
    let service_key = config.pagerDutyCriticalKey;
    let options = {
        method: 'POST',
        uri,
        body: {
            service_key,
            event_type : 'trigger',
            description : `High request failure for past ${config.timespan}`,
            incident_key : "Request-failure-alert",
            details : details
        },
        json: true
    };
    rp(options);
}