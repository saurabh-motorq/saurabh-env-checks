let rp = require('request-promise');
let config = require('./config');
const _ = require('lodash');

let appInsightConfigs = config.appInsightConfigs;

module.exports = async function (context, req) {
    context.log('Starting exception-alerts');
    config.context=context;
    for (let appInsightConfig of appInsightConfigs) {
        config.context.log(appInsightConfig['name']);
        let appId = appInsightConfig['appId'];
        let apiKey = appInsightConfig['key'];
        let name = appInsightConfig['name'];
        let uri = 'https://api.applicationinsights.io/v1/apps/' + appId + '/query';
        const endpoints = [];
        endpoints.push({name: "enrollment", query: config.enrollmentQuery});
        endpoints.push({name: "unenrollment", query: config.unenrollmentQuery});
        for(const endpoint of endpoints) {
            let options = {
                uri: uri,
                qs: {
                    timespan: config.timespan,
                    query: endpoint.query
                },
                headers: {
                    'x-api-key': apiKey
                },
                json: true
            };
            let res = await rp(options);
            const enrollmentLimit = appInsightConfig.enrollmentLimit || 100;
            if(shouldTriggerAlert(res, enrollmentLimit)){
                const source = appInsightConfig.pagerMessage.split('for')[1].trim() 
                await raisePagerDutyTrigger([endpoint.name], appInsightConfig.pagerDutyCriticalKey, appInsightConfig.pagerMessage, source);
            }
        }
    }
};

function shouldTriggerAlert(result, limit) {
    const count = result.tables[0].rows[0][0];
    return count > limit;
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
            dedup_key: "Too many delete enrollments",
            payload
        },
        json: true
    };
    await rp(options);
}