require('dotenv').config();
const config = {};

config.environments = [
    {
        name: "",
        endpoint: "",
        primaryKey: "",
        database: { id: 'core-fleet' },
        collection: {
            "entitiesId": "entities",
            "telematicsId": "telematics"
        },
        eventHubDocumentIds: [
            {
                eventHubNamespace: "",
                eventHub: "",
                partition: "",
                documentId: ""
            }
        ]
    }
]
config.mailerUrl = process.env.MAILER_URL;
config.mailFrom = 'automatedtest@Motorq.co';
config.mailTo = 'servicealerts@motorq.co';
config.mailSubject = 'Action Required - Processing Lag';
config.mailText = 'Eventhub Offset Checkpoint Status';
config.storageConnectionString = process.env.STORAGE_CONNECTION_STRING;
config.azureLocalStorage = (process.env.AZURE_LOCAL_STORAGE || "false") === "true";
config.azureFunctionStateTableName = process.env.AZURE_FUNCTION_STATE_TABLE_NAME || 'azurefunctionstate';

module.exports = config;