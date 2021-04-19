let config = require('./config');
let rp = require('request-promise');
const uuid = require('uuid').v4;

module.exports = async function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    context.log('Starting Processor speed check');
    let options = constructAppinsightsQueryWithParams(context);
    let appinsightsResults = await rp(options);
    let parsedResult = parseappInsightResults(appinsightsResults, context);
    if (parsedResult.length) {
        raisePagerDutyTrigger(parsedResult, context);
    }
};

function constructAppinsightsQueryWithParams(context) {
    let appId = config.appId;
    let apiKey = config.key;
    let uri = 'https://api.applicationinsights.io/v1/apps/' + appId + '/query';
    let options = {
        uri: uri,
        qs: {
            timespan : config.timespan,
            query : config.query
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
        if (row.length && row[3] > config.cutOffTimeSec) {
            parsedResult.push({
                batchId: row[4],
                timeTakenSec: row[3]
            })
        }
    }
    return parsedResult;
}


function raisePagerDutyTrigger(parsedResult, context) {
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
            description: `Message processing very slow for some batches for the ${config.timespan}`,
            incident_key: `processing-slow ${uuid()}`,
            details: details
        },
        json: true
    };
    rp(options);
}