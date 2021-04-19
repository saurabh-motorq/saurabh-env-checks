let { environments } = require('../common/environments');
let rp = require('request-promise');
const moment = require('moment-timezone');
const _ = require('lodash');

module.exports = async function (context, myTimer) {
    let centralMoment = moment().tz('America/Chicago');
    context.log('Starting request Monitoring : ' + centralMoment.toISOString());
    context.log(`Environments length :  ${environments.length}`)
    for (const env of environments) {
        if(!env.apiEndpointsToMonitor) {
            continue;
        }
        context.log(`Starting check for environment  : ${env.name}`)
        try {
            let endpoints = getEndpointsToMonitor(env)
            if(!endpoints.length) {
                continue;
            }
            let options = constructAppinsightsQueryWithParams(env, endpoints);
            let appinsightsResults = await rp(options);
            let parsedResult = parseappInsightResults(appinsightsResults);
            console.log(parsedResult);
            let htmlBody = composeMailBody(parsedResult, env);
            if (shouldSendMail(htmlBody, centralMoment)) {
                mail({ htmlBody });
            }
        } catch (error) {
            context.log(error);
            config.currentContext.log(`Request monitoring failed for environment ${env.name}`);
            failures.push(`Request monitoring failed for environment ${env.name}`)
        }
    }
   
};

function constructAppinsightsQueryWithParams(env, endpoints) {
    let appId = env.infra.ai.id;
    let apiKey = env.infra.ai.key;
    let uri = 'https://api.applicationinsights.io/v1/apps/' + appId + '/query';
    let query = constructQuery(endpoints, env);
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


function getEndpointsToMonitor(env) {
    const endpoints = [];
    if(env.apiEndpointsToMonitor) {
        const isEndPointRequired = env.apiEndpointsToMonitor;
        if(isEndPointRequired['telemetry-feed']) {
            if(env.apiVersion == 'v2.1') {
                endpoints.push(`GET /v2.1/status/feed`)
            } else {
                endpoints.push(`GET /v3/telemetry/feed`)
            }
        }
        if(isEndPointRequired['event-feed']){
            endpoints.push(`GET /${env.apiVersion}/events/feed`)
        }
        if(isEndPointRequired['trip-feed']) {
            endpoints.push(`GET /${env.apiVersion}/trips/feed`)
        }
        if(isEndPointRequired['enrollments']) {
            endpoints.push(`GET /${env.apiVersion}/enrollments`)
            endpoints.push(`POST /${env.apiVersion}/enrollments`)
            endpoints.push(`DELETE /${env.apiVersion}/enrollments`)
            endpoints.push(`GET /${env.apiVersion}/operations`)
        }
        if(isEndPointRequired['vehicles']) {
            endpoints.push(`GET /${env.apiVersion}/vehicles`)
        }
        if(isEndPointRequired['devices']) {
            endpoints.push(`GET /${env.apiVersion}/devices`)
        }
    }
    if(env.shouldMonitorFmcaEndpoints) {
        if(env.apiVersion == 'v3'){
            endpoints.push(`GET /v2.1/devices`) // fleet-api endpoint used by fmca
            endpoints.push(`GET /v2.1/vehicles`) // fleet-api endpoint used by fmca
        }
        endpoints.push(`GET /customerVehicleIds`)
        endpoints.push(`GET /userprofile`)
        endpoints.push(`GET /getcompanylogo`)
        endpoints.push(`GET /uiconfigs`)
        endpoints.push(`GET /offices`)
        endpoints.push(`GET /departments`)
        endpoints.push(`GET /alldrivers`)
        endpoints.push(`GET /vins`)
        endpoints.push(`GET /customers`)
    }
    return endpoints;
}

function constructQuery(endpoints, env) {
    let timespan = env.endpointIdleTimeoutInMins != "" ? env.endpointIdleTimeoutInMins + "m" : "20m";
    let centralMoment = moment().tz('America/Chicago');
    let hour = centralMoment.hours();
    let minute = centralMoment.minutes();
    if (hour == 0 && minute < 15) {
        timespan = '24h'
    }
    let endpointConditions = "";
    let shouldPrependOr = false;
    for (const endpoint of endpoints) {
        endpointConditions += shouldPrependOr ? "or " : "where "
        shouldPrependOr = true;
        endpointConditions += `name contains '${endpoint}' `
    }    
    let query = `requests | where timestamp > ago(${timespan})  `;
    query += `| `
    query += endpointConditions;
    query += `| extend method = case(name contains "operations", substring(name, 0, 21), substring(name, 0, 23))`;
    query += `| summarize avg(duration) , percentiles(duration, 95,99),count() by method,success`;
    query += `| order by method,success desc `;
    return query;
}

function parseappInsightResults(results) {
    let parsedResult = {};
    let headers = [];
    for (let column of results.tables[0].columns) {
        let header = column.name;
        headers.push(header);
    }
    parsedResult.headers = headers;
    let rows = [];
    for (let row of results.tables[0].rows) {
        rows.push(row);
    }
    parsedResult.rows = rows
    return parsedResult;
}

function composeMailBody(parsedResult, env) {
    if (parsedResult.rows.length === 0 && env.endpointIdleTimeoutInMins != "") {
        return `<strong>${env.name} idle for past ${env.endpointIdleTimeoutInMins} minutes. Please check</strong><br>`;
    }
    let htmlBody = `<strong>Response rate for past 24h - ${env.name}</strong><br></br>`;
    htmlBody += '<table border="1"><tr>'
    for (let header of parsedResult.headers) {
        htmlBody += `<th>${header}</th>`;   
    }
    htmlBody += '</tr>';
    for (let row of parsedResult.rows) {
        htmlBody += '<tr>'
        for (let responseRates of row) {
            let cellValue = _.isFinite(parseFloat(responseRates)) ? _.round(responseRates, 3) : responseRates;
            htmlBody += `<td>${cellValue}</td>`;
        }
        htmlBody += '</tr>'
    }
    htmlBody += '</table>'
    return htmlBody;
}

function shouldSendMail(htmlBody, centralMoment) {
    if (htmlBody.search('idle') > -1) {
        return true;
    }
    else {
        let hour = centralMoment.hours();
        let minute = centralMoment.minutes();
        if (hour == 0 && minute < 15) {
            return true;
        }
    }
    return false;
}
function mail({
    fileName,
    fileType,
    fileContents,
    body,
    htmlBody
}) {
    let options = {
        method: 'POST',
        uri: config.mailerUrl,
        body: {
            "from": config.mailFrom,
            "to": config.mailTo,
            "subject": config.mailSubject,
            "text": body,
            "html": htmlBody,
            "b64": fileContents,
            "fileName": fileName,
            "fileType": fileType
        },
        json: true
    };
    rp(options);
}