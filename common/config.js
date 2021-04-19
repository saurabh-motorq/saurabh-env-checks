require('dotenv').config();
const config = {};

config.mailerUrl = process.env.MAILER_URL;
config.mailFrom = 'automatedtest@Motorq.co';
config.mailTo = 'servicealerts@motorq.co';
config.storageConnectionString = process.env.STORAGE_CONNECTION_STRING;
config.azureLocalStorage = (process.env.AZURE_LOCAL_STORAGE || "false") === "true";
config.azureFunctionStateTableName = process.env.AZURE_FUNCTION_STATE_TABLE_NAME || 'azurefunctionstate';

module.exports = config;