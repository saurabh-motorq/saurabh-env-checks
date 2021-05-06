const { insertAlertIntoPg } = require("./pg-repo");
const config = require('./config');
const moment = require('moment');
const helper = require('./helper');
let rp = require('request-promise');

async function performCaptureEnabledCheck(context, env, bearerToken)
{
    for(const key in env.infra.eh)
    {
        eventhubs = env.infra.eh;
        if(eventhubs[key].name && eventhubs[key].isSource === 1)
        {
            let apicall = {};
            apicall.resourceUri = eventhubs[key].namespace_uri;
            apicall.metricNames = `CapturedMessages,IncomingMessages`;
            apicall.apiVersion = config.ehApiVersion;
            apicall.aggregation= `count`;
            apicall.filter= `EntityName EQ '${eventhubs[key].name}'`;
            apicall.timespan= `${moment().subtract(6,'hours').toISOString()}/${moment().toISOString()}`;
            apicall.interval= config.capture_check_timegrain;

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
                    {
                        context.log(`Capture not enabled for the eventhub ${eventhubs[key].name}`);
                        await insertAlertIntoPg(env.name, 'CAPTURE_ENABLED_CHECK', {details: `Capture not enabled for ${eventhubs[key].name}`});
                    }
                    else
                        context.log('No ingress messages present to test capture');
                }
            }
            catch(err){
                context.log(err);
                await insertAlertIntoPg(env.name,'CAPTURE_ENABLED_CHECK',{details: `Check failed for eventhub ${eventhubs[key].name}`});
            }
        }
    }
}

module.exports = { performCaptureEnabledCheck };