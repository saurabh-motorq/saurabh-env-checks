require('dotenv').config();
const config = require("./config");
const { environments } = require('../common/environments/index');
const captureEnabledCheckRepo = require('./capture-enabled-check-repo');
const ingressMessagesCheckRepo = require('./eventhub-data-ingress-check-repo');
const ingressEgressMessageCountCheckRepo = require('./ingress-egress-message-count-check-repo');
const latestDataCheckRepo = require('./latest-data-check-repo');
const throttledRequestsCheckRepo = require('./throttled-requests-check-repo');
let rp = require('request-promise');

async function getbearertoken(context, env)
{
    let tenantId=env.infra.eh.tenantId;
    const url= `https://login.microsoftonline.com/${tenantId}/oauth2/token`;
    const client_id=env.infra.eh.clientId;
    const client_secret=env.infra.eh.clientSecret;
    const grant_type=`client_credentials`;
    const resource = `https://management.azure.com`;
    var options = {
        'method': 'POST',
        'url': `${url}`,
        formData: {
          'client_id': `${client_id}`,
          'client_secret': `${client_secret}`,
          'grant_type': `${grant_type}`,
          'resource': `${resource}`
        }
    };
    let resp=null;
    try{
    resp = await rp(options, function (error, response) {
        if (error)
            throw new Error(error);
        return response.body;
    });
    }
    catch(error){
        context.log(error);
    }
    return JSON.parse(resp).access_token;
}

module.exports = async function (context, myTimer) {
    context=console;
    for(const env of environments) {
        if(env.infra.eh)
        {
            const bearerToken = await getbearertoken(context,env);
            await captureEnabledCheckRepo.performCaptureEnabledCheck(context,env,bearerToken);
            await ingressMessagesCheckRepo.performIngressMessagesCheck(context,env,bearerToken);
            await ingressEgressMessageCountCheckRepo.performIngressEgressMessageCountCheck(context,env,bearerToken);
            await latestDataCheckRepo.performLatestDataCheck(context,env);
            await throttledRequestsCheckRepo.performThrottledRequestsCheck(context,env,bearerToken);
        }
    }
};