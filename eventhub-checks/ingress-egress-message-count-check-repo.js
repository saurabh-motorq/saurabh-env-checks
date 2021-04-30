const { insertAlertIntoPg } = require("./pg-repo");
const config = require('./config');
const moment = require('moment');
const helper = require('./helper');
let rp = require('request-promise');

async function performIngressEgressMessageCountCheck(context, env, bearerToken)
{
    for(const key in env.infra.eh)
    {
        eventhubs=env.infra.eh;
        if(eventhubs[key].name && eventhubs[key].isCustomer === 1)
        {
            let apicall = {};
            apicall.resourceUri = eventhubs[key].namespace_uri;
            apicall.metricNames = `IncomingMessages,OutgoingMessages`;
            apicall.apiVersion = config.ehApiVersion;
            apicall.aggregation= `count`;
            apicall.filter= `EntityName EQ '${eventhubs[key].name}'`;
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
                    context.log(`No ingress or egress data in the eventhub ${eventhubs[key].name}`);
                    await insertAlertIntoPg(env.name, 'INGRESS_EGRESS_MESSAGE_COUNT_CHECK', {details:`No ingress or egress data in eventhub ${eventhubs[key].name} in past 24 hours`});
                }
                else{
                    if(value[0].timeseries.length !== 0 && value[1].timeseries.length ===0)
                    {
                        context.log(`No egress in the event hub ${eventhubs[key].name}`);
                        await insertAlertIntoPg(env.name, 'INGRESS_EGRESS_MESSAGE_COUNT_CHECK', {details: `No egress data in eventhub ${eventhubs[key].name} in past 24 hours`});
                    }
                    else if(value[0].timeseries.length === 0 && value[1].timeseries.length !==0)
                    {
                        context.log(`No ingress in the event hub ${eventhubs[key].name}`);
                        await insertAlertIntoPg(env.name, 'INGRESS_EGRESS_MESSAGE_COUNT_CHECK', {details:`No ingress data in eventhub ${eventhubs[key].name} in past 24 hours`});
                    }
                    else{
                        if(value[0].timeseries[0].data[0].count !== value[1].timeseries[0].data[0].count)
                        {
                            context.log(`different ingress and egress messages in last 24 hours in ${eventhubs[key].name}`)
                            await insertAlertIntoPg(env.name, 'INGRESS_EGRESS_MESSAGE_COUNT_CHECK', {details: `Different ingress egress messages in eventhub ${eventhubs[key].name} in past 24 hours`});
                        }
                        else
                            context.log(`same ingress egress messages int the event hub ${eventhubs[key].name}`);
                    }
                }
            }
            catch(err){
                context.log(err);
                await insertAlertIntoPg(env.name,'INGRESS_EGRESS_MESSAGE_COUNT_CHECK',{details: `Check failed for eventhub ${eventhubs[key].name}`});
            }
        }
    }
}

module.exports = { performIngressEgressMessageCountCheck };