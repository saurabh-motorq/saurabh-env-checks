require('dotenv').config();
const config = {};

config.environments = [
    {
        name: "",
        feedApiUrl: "",
        clientId: "",
        clientSecret: "",
        audience: ""
    }
]
config.serviceName = process.env.SERVICE_NAME || "InternalMonitoring";
config.mailerUrl = process.env.MAILER_URL;
config.mailFrom = 'automatedtest@Motorq.co';
config.mailTo = 'servicealerts@motorq.co';
config.mailSubject = 'Action Required - API Endpoint Down';
config.mailText = 'Fleet API Endpoint Status';

config.storageConnectionString = process.env.STORAGE_CONNECTION_STRING;
config.azureLocalStorage = (process.env.AZURE_LOCAL_STORAGE || "false") === "true";
config.azureFunctionStateTableName = process.env.AZURE_FUNCTION_STATE_TABLE_NAME || 'azurefunctionstate';

module.exports = config;