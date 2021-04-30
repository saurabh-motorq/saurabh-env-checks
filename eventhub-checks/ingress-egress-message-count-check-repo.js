const { insertAlertIntoPg } = require("./pg-repo");
const config = require('./config');
const moment = require('moment');
const helper = require('./helper');
let rp = require('request-promise');

async function performIngressEgressMessageCountCheck(context, env, bearerToken)
{
    let apicall = {};
    apicall.resourceUri = env.infra.eh.eventhub_namespace_uri;
    apicall.metricNames = `IncomingMessages,OutgoingMessages`;
    apicall.apiVersion = config.ehApiVersion;
    apicall.aggregation= `count`;
    apicall.filter= `EntityName EQ '${env.infra.eh.feed_event_hub}'`;
    apicall.timespan= `${moment().subtract(1,'days').toISOString()}/${moment().toISOString()}`;
    apicall.interval= `PT24H`;

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
        //0-> for incoming messages and 1-> for outgoing messages.
        if(value[0].timeseries.length === 0 && value[1].timeseries.length ===0)
        {
            context.log(`No ingress or egress data in the eventhub ${env.infra.eh.feed_event_hub}`);
            await insertAlertIntoPg(env.name, 'INGRESS_EGRESS_MESSAGE_COUNT_CHECK', `No ingress or egress data in eventhub ${env.infra.eh.feed_event_hub} in past 24 hours`);
        }
        else{
            if(value[0].timeseries.length !== 0 && value[1].timeseries.length ===0)
            {
                context.log(`No egress in the event hub ${env.infra.eh.feed_event_hub}`);
                await insertAlertIntoPg(env.name, 'INGRESS_EGRESS_MESSAGE_COUNT_CHECK', `No egress data in eventhub ${env.infra.eh.feed_event_hub} in past 24 hours`);
            }
            else if(value[0].timeseries.length === 0 && value[1].timeseries.length !==0)
            {
                context.log(`No ingress in the event hub ${env.infra.eh.feed_event_hub}`);
                await insertAlertIntoPg(env.name, 'INGRESS_EGRESS_MESSAGE_COUNT_CHECK', `No ingress data in eventhub ${env.infra.eh.feed_event_hub} in past 24 hours`);
            }
            else{
                if(value[0].timeseries[0].data[0].count !== value[1].timeseries[0].data[0].count)
                {
                    context.log(`different ingress and egress messages in last 24 hours in ${env.infra.eh.feed_event_hub}`)
                    await insertAlertIntoPg(env.name, 'INGRESS_EGRESS_MESSAGE_COUNT_CHECK', `Different ingress egress messages in eventhub ${env.infra.eh.feed_event_hub} in past 24 hours`);
                }
                else
                    context.log(`same ingress egress messages int the event hub ${env.infra.eh.feed_event_hub}`);
            }
        }
    }
    catch(err){
        context.log(err);
        await insertAlertIntoPg(env.name,'INGRESS_EGRESS_MESSAGE_COUNT_CHECK',`Check failed for eventhub ${env.infra.eh.feed_event_hub}`);
    }
}

module.exports = { performIngressEgressMessageCountCheck };