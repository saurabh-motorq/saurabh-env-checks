const { insertAlertIntoPg } = require("./pg-repo");
const config = require('./config');
const moment = require('moment');
const helper = require('./helper');
let rp = require('request-promise');

async function performCaptureEnabledCheck(context, env, bearerToken)
{
    let apicall = {};
    apicall.resourceUri = env.infra.eh.eventhub_namespace_uri;
    apicall.metricNames = `CapturedMessages,IncomingMessages`;
    apicall.apiVersion = config.ehApiVersion;
    apicall.aggregation= `count`;
    apicall.filter= `EntityName EQ '${env.infra.eh.feed_event_hub}'`;
    apicall.timespan= `${moment().subtract(6,'hours').toISOString()}/${moment().toISOString()}`;
    apicall.interval= `PT6H`;

    try{
        const endpoint = helper.createEventhubHubMetricApiEndpoint(apicall);
        var options = {
            'method': 'GET',
            'url': endpoint,
            'headers': {
                'Authorization': `Bearer ${bearerToken}`
            }
        };
        const responseBody = await rp(options, function(error,response)
        {
            if(error){
                context.log(error);
            }
            return response.body;
        });
        const value=JSON.parse(responseBody).value;
        //0-> for captured messages and 1-> for incoming messages.
        if(value[0].timeseries.length !== 0 && value[0].timeseries[0].count!==0)
        {
            context.log("capture working properly");
        }
        else{
            if(value[1].timeseries.length !== 0 && value[1].timeseries[0].data[0].count !== 0)
                await insertAlertIntoPg(env.name, 'CAPTURE_ENABLED_CHECK', `Capture not enabled for ${env.infra.eh.feed_event_hub}`);
            else
                context.log('No ingress messages present to test capture');
        }
    }
    catch(err){
        context.log(err);
        await insertAlertIntoPg(env.name,'CAPTURE_ENABLED_CHECK',`Check failed for eventhub ${env.infra.eh.feed_event_hub}`)
    }
}

module.exports = { performCaptureEnabledCheck };