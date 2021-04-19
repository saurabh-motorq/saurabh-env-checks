const jwtDecode = require("jwt-decode");
const moment = require("moment");
const rp = require('request-promise');
const config = require('./config');
const tableStore = require('../common/table-store');

const accessTokens = {};

module.exports = async function getAccessToken() {
    await restoreAccessToken();
    if (!isTokenValid(config.currentEnv.name)) {
        const options = {
            method: "POST",
            uri: config.currentEnv.feedApiUrl + "/oauth/token" + "?serviceName=" + config.serviceName,
            body: {
                audience: config.currentEnv.audience,
                clientId: config.currentEnv.clientId,
                clientSecret: config.currentEnv.clientSecret,
                grantType: "client_credentials",
            },
            json: true
        };

        const response = await rp(options);
        accessTokens[config.currentEnv.name] = response.accessToken;
        await saveAccessToken(response.accessToken);
    }
    return accessTokens[config.currentEnv.name];
}

async function restoreAccessToken() {
    try {
        if (!accessTokens[config.currentEnv.name]) {
            const entity = await tableStore.getEntity(config.azureFunctionStateTableName, 'access-token', `${config.currentEnv.name.toLowerCase()}-access-token`);
            const data = JSON.parse(entity.data);
            accessTokens[config.currentEnv.name] = data.token;
            console.log(`${config.currentEnv.name} access token restored`);
        }
    }
    catch (err) {
        accessTokens[config.currentEnv.name] = "";
        console.log(`${config.currentEnv.name} access token does not exist in storage`);
        if (err.statusCode !== 404) {
            console.log(err);
        }
    }
}

async function saveAccessToken(accessToken) {
    try {
        const entity = tableStore.createTableEntry('access-token', `${config.currentEnv.name.toLowerCase()}-access-token`, { token: accessToken });
        await tableStore.upsertEntityIntoTableStore(config.azureFunctionStateTableName, entity);
    }
    catch (err) {
        console.log(err);
    }
}

function isTokenValid() {
    if (accessTokens[config.currentEnv.name]) {
        const parsedToken = jwtDecode(accessTokens[config.currentEnv.name]);
        return parsedToken.expiresIn && parsedToken.expiresIn > moment().subtract(90, 's').unix();
    }
    return false;
}