const { insertAlertIntoPg } = require("./pg-repo");
const config = require('./config');
const moment = require('moment');
const helper = require('./helper');
let rp = require('request-promise');

async function performIngressMessagesCheck(context, env, bearerToken)
{
    for(const key in env.infra.eh)
    {
        eventhubs=env.infra.eh;
        if(eventhubs[key].name)
        {
            let apicall = {};
            apicall.resourceUri = eventhubs[key].namespace_uri;
            apicall.metricNames = `IncomingMessages`;
            apicall.apiVersion = config.ehApiVersion;
            apicall.aggregation= `count`;
            apicall.filter= `EntityName EQ '${eventhubs[key].name}'`;
            apicall.timespan= `${moment().subtract(1,'days').toISOString()}/${moment().toISOString()}`;
            apicall.interval= config.data_ingress_check_timegrain;

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
                if(value[0].timeseries.length !== 0 && value[0].timeseries[0].count!==0)
                {
                    context.log(`ingress messages seen for the event hub ${eventhubs[key].name} in past 24 hours`);
                }
                else{
                        context.log(`No messages received for the event hub ${eventhubs[key].name} in past 24 hours`)
                        await insertAlertIntoPg(env.name, 'INGRESS_MESSAGES_CHECK', {details: `No messages received for the event hub ${eventhubs[key].name} in past 24 hours`});
                }
            }
            catch(err){
                context.log(err);
                await insertAlertIntoPg(env.name,'INGRESS_MESSAGES_CHECK', {details: `Check failed for eventhub ${eventhubs[key].name}`});
            }
        }
    }
}

module.exports = { performIngressMessagesCheck };