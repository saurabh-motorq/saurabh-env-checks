let rp = require('request-promise');
let config = require('./config');
let { environments } = require('../common/environments')
let getAccessToken = require('./tokenManager');
let endpointStatus = require('./enums');
let tableStore = require('../common/table-store');

let mailBody = "";

module.exports = async function (context, req) {
    config.currentContext = context;
    tableStore.init(config.azureLocalStorage, config.storageConnectionString);
    tableStore.createTableIfNotExists(config.azureFunctionStateTableName);
    for(const env of environments){
        if(!env.apiEndpointsToMonitor) {
            continue;
        }
        await startChecking(env)
        console.log(mailBody);
    }
    if (mailBody != '') {
        await sendMail();
        mailBody = '';
    }
    config.currentContext.log('Completed');
}

async function startChecking(env) {
    try {
        
        config.currentEnv = env;
        config.currentEnvStatus = getDefaultEnvStatus();
        const authToken = await getAccessToken();
        const vehicles = await getVehicles(authToken, env);
        if (vehicles.length > 0) {
            await getLatest(vehicles[0].id, authToken, env);
            await getFeeds(vehicles[0].id, authToken, env);
            await getEnrollments(authToken, env)
            await getOpenEvent(vehicles[0].id, authToken, env);
            await getDevices(authToken, env);
        }
        await appendMailBodyIfRequired();
    }
    catch (err) {
        config.currentContext.log(err);
    }
}

async function appendMailBodyIfRequired() {
    if (Object.values(config.currentEnvStatus).indexOf(endpointStatus.FAILED) < 0) {
        console.log(config.currentEnvStatus);
        config.currentContext.log(`Environment: ${config.currentEnv.name}, Completed successfully`);
    }
    else {
        config.currentContext.log(`Environment: ${config.currentEnv.name}, Completed with failure`);
        appendMailBody();
        config.currentContext.log(mailBody);
    }
}

function appendMailBody() {
    mailBody += `<br/><strong>Environment: ${config.currentEnv.name}, Please find the endpoint status below,<br/><strong>`;
    for (const endpoint of Object.keys(config.currentEnvStatus)) {
        mailBody += `${endpoint} - ${config.currentEnvStatus[endpoint]}<br/>`;
    }
}

async function getEnrollments(authToken, env) {
    if(!env.apiEndpointsToMonitor['enrollments']){
        return;
    }
    try {
        const options = {
            method: "GET",
            uri: config.currentEnv.feedApiUrl + "/enrollments" + "?serviceName=" + config.serviceName,
            json: true,
            headers: {
                Authorization: `Bearer ${authToken}`,
            }
        };
        const response = await rp(options);
        config.currentEnvStatus["enrollments"] = endpointStatus.SUCCESS;
        return response.items;
    }
    catch (err) {
        config.currentContext.log('Enrollment endpoint failed');
        config.currentContext.log(err);
        config.currentEnvStatus["enrollments"] = endpointStatus.FAILED;
    }
}

async function getFeeds(vehicleId, authToken, env) {
    const feeds = {'telemetry-feed': '/telemetry/feed', 
                   'event-feed': '/events/feed', 
                   'trip-feed': '/trips/feed'};
    for(const feed of Object.keys(feeds)) {
        if(!env.apiEndpointsToMonitor[feed]){
            continue;
        }
        try {
            const options = {
                method: "GET",
                uri: config.currentEnv.feedApiUrl + feeds[feed]  + "?vehicleId=" + vehicleId + "&startTimestamp=2020-01-30T00:00:00.000Z&count=10" +  "&serviceName=" + config.serviceName,
                json: true,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                }
            };
            const response = await rp(options);
            config.currentEnvStatus[feed] = endpointStatus.SUCCESS;
        }
        catch (err) {
            config.currentContext.log(`${feed} endpoint failed`);
            config.currentContext.log(err);
            config.currentEnvStatus[feed] = endpointStatus.FAILED;
        }
    }
}

async function sendMail() {
    let options = {
        method: 'POST',
        uri: config.mailerUrl,
        body: {
            "from": config.mailFrom,
            "to": config.mailTo,
            "subject": config.mailSubject,
            "text": config.mailText,
            "html": mailBody
        },
        json: true
    };
    await rp(options);
}

function getDefaultEnvStatus() {
    return {
        "vehicles": endpointStatus.NOT_STARTED,
        "devices": endpointStatus.NOT_STARTED,
        "open-events": endpointStatus.NOT_STARTED,
        "latest": endpointStatus.NOT_STARTED,
        "telemetry-feed": endpointStatus.NOT_STARTED,
        "event-feed": endpointStatus.NOT_STARTED,
        "trip-feed": endpointStatus.NOT_STARTED,
        "enrollments": endpointStatus.NOT_STARTED
    };
}

async function getOpenEvent(vehicleId, authToken, env) {
    if(!env.apiEndpointsToMonitor['open-events']){
        return;
    }
    try {
        const options = {
            method: "POST",
            uri: config.currentEnv.feedApiUrl + "/events/open"  + "?serviceName=" + config.serviceName,
            json: true,
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            body: {
                vehicleIds: [vehicleId]
            }
        };
        const response = await rp(options);
        config.currentEnvStatus["open-events"] = endpointStatus.SUCCESS;
        return response.items;
    }
    catch (err) {
        config.currentContext.log('Open event endpoint failed');
        config.currentContext.log(err);
        config.currentEnvStatus["open-events"] = endpointStatus.FAILED;
    }
}

async function getLatest(vehicleId, authToken, env) {
    if(!env.apiEndpointsToMonitor['latest']){
        return;
    }
    try {
        const options = {
            method: "POST",
            uri: config.currentEnv.feedApiUrl + "/telemetry/latest",
            json: true,
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            body: {
                vehicleIds: [vehicleId]
            }
        };
        const response = await rp(options);
        config.currentEnvStatus["latest"] = endpointStatus.SUCCESS;
        return response.items;
    }
    catch (err) {
        config.currentContext.log('Latest endpoint failed');
        config.currentContext.log(err);
        config.currentEnvStatus["latest"] = endpointStatus.FAILED;
    }
}

async function getVehicles(authToken, env) {
    if(!Object.values(env.apiEndpointsToMonitor).includes(true)){
        return;
    }
    try {
        const options = {
            method: "GET",
            uri: config.currentEnv.feedApiUrl + "/vehicles?count=10" + "&serviceName=" + config.serviceName,
            json: true,
            headers: {
                Authorization: `Bearer ${authToken}`,
            }
        };
        const response = await rp(options);
        config.currentEnvStatus["vehicles"] = endpointStatus.SUCCESS;
        return response.items;
    }
    catch (err) {
        config.currentContext.log('Vehicles endpoint failed');
        config.currentContext.log(err);
        config.currentEnvStatus["vehicles"] = endpointStatus.FAILED;
        return [];
    }
}

async function getDevices(authToken, env) {
    if(!env.apiEndpointsToMonitor['devices']){
        return;
    }
    try {
        const options = {
            method: "GET",
            uri: config.currentEnv.feedApiUrl + "/devices?count=10" + "&serviceName=" + config.serviceName,
            json: true,
            headers: {
                Authorization: `Bearer ${authToken}`,
            }
        };
        const response = await rp(options);
        config.currentEnvStatus["devices"] = endpointStatus.SUCCESS;
        return response.items;
    }
    catch (err) {
        config.currentContext.log('Devices endpoint failed');
        config.currentContext.log(err);
        config.currentEnvStatus["devices"] = endpointStatus.FAILED;
        return [];
    }
}

//startChecking(config.environments[0]);