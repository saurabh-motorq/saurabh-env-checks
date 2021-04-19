const rp = require('request-promise');
const config = require('./config');
const { environments } = require('../common/environments');
const eventHub = require("@azure/event-hubs");
const { DocumentClient, DocumentBase } = require('documentdb');
const lodash = require('lodash');
const moment = require("moment");
const Table = require('table-builder');
const tableStore = require('../common/table-store');

async function main(context, req) {
    context.log('Starting checkpoint monitoring')
    config.currentContext = context || console;
    tableStore.init(config.azureLocalStorage, config.storageConnectionString);
    tableStore.createTableIfNotExists(config.azureFunctionStateTableName);
    const outdatedOffsets = [];
    const pdAlertConfigs = [];
    const failures = [];
    context.log(`Environments length :  ${environments.length}`)
    for (const env of environments) {
        try {
            const results = await startChecking(env);
            outdatedOffsets.push(...results.mailAlertConfigs);
            pdAlertConfigs.push(...results.pdAlertConfigs)
            context.log(`Ended check for environment  : ${env.name}`)
        } catch (error) {
            context.log(error);
            config.currentContext.log(`Checkpoint monitoring failed for environment ${env.name}`);
            failures.push(`Checkpoint monitoring failed for environment ${env.name}`)
        }
    }
    let html = "";
    if (outdatedOffsets.length > 0) {
        html = getHTMLContent(outdatedOffsets);

    }
    if (failures.length > 0) {
        html += `<br/>${failures.join('<br/>')}`
    }
    if (html) {
        try {
            await sendMail(html);
        } catch (error) {
            config.currentContext.log('error in Sending mail');
            config.currentContext.log(error);
        }
    }
    for (const pdAlertConfig of pdAlertConfigs) {
        try {
            config.currentContext.log(`Raising PD alert for ${pdAlertConfig.source}`);
            await raisePagerDutyTrigger(pdAlertConfig)
        } catch (error) {
            config.currentContext.log('error in raising pd alert');
            config.currentContext.log(error);
        }

    }

    config.currentContext.log('Completed');
}

function getHTMLContent(outdatedOffsets) {
    const headers = {
        environment: "Environemnt",
        documentId: "Document ID",
        partition: "Partition",
        eventHubOffset: "Last Enqueued Offset",
        documentOffset: "Checkpointed Offset",
        eventHubTimestamp: "Last Enqueued Timestamp",
        documentTimestamp: "Checkpointed Timestamp"
    };
    return (new Table({ border: "1" }))
        .setHeaders(headers)
        .setData(outdatedOffsets)
        .render();
}

async function startChecking(env) {
    try {
        config.currentContext.log(`Starting check for environment  : ${env.name}`)
        return validateCheckpoint(env);
    }
    catch (err) {
        config.currentContext.log(err);
    }
}

async function validateCheckpoint(env) {
    const outdatedOffsets = [];
    const databaseUrl = `dbs/${env.infra.cosmos.db}`;
    const telematicsCollectionUrl = `${databaseUrl}/colls/${env.infra.cosmos.telematicsId}`;
    const dbClient = getDBClient(env.infra.cosmos);
    for (const checkpointDetail of env.eventHubDocumentIds) {
        const partitionInfo = await getEventHubPartitionInfo(checkpointDetail);
        const result = await getCheckpointDocument(checkpointDetail, dbClient, telematicsCollectionUrl);
        const checkpointDocument = result.items.length ? result.items[0] : null;
        if (isCheckpointOutdated(checkpointDocument, partitionInfo)) {
            config.currentContext.log(`Checkpoint outdated for ${env.name}`)
            const outdatedOffset = {
                environment: env.name,
                documentId: checkpointDetail.documentId,
                partition: checkpointDetail.partition,
                eventHubOffset: partitionInfo.lastEnqueuedOffset,
                eventHubTimestamp: partitionInfo.lastEnqueuedTimeUtc.toISOString(),
                documentOffset: checkpointDocument ? checkpointDocument.offset : 'N/A',
                documentTimestamp: (checkpointDocument && checkpointDocument.lastRecordCreatedTime ? checkpointDocument.lastRecordCreatedTime : (checkpointDocument ? `${moment.unix(checkpointDocument._ts).toISOString()} (_ts)` : 'N/A'))
            };
            outdatedOffsets.push(outdatedOffset);
        }
    }
    return await getValidOutdatedOffsets(outdatedOffsets, env);
}

async function getValidOutdatedOffsets(outdatedOffsets, env) {
    const lastOutdatedOffsets = await getLastOutdatedOffsets(env.name);
    const validOutdatedOffsets = [];
    const pdAlertConfigs = [];
    outdatedOffsets.forEach(outdatedOffset => {
        if (lodash.some(lastOutdatedOffsets, offset => offset.environment == outdatedOffset.environment && offset.documentId == outdatedOffset.documentId)) {
            validOutdatedOffsets.push(outdatedOffset);
            pdAlertConfigs.push(getPagerDutyAlertConfig(outdatedOffset, env));
        }
    });
    await saveOutdatedOffsets(outdatedOffsets, env.name);
    return ({ mailAlertConfigs: validOutdatedOffsets, pdAlertConfigs });
}

function getPagerDutyAlertConfig(checkpointDocument, env) {
    return {
        parsedResult: checkpointDocument,
        pagerDutyCriticalKey: env.infra.pager.criticalKey,
        pagerMessage: `Eh checkpoint lagging for ${env.name}`,
        source: env.name
    }
}

async function getLastOutdatedOffsets(envName) {
    try {
        const entity = await tableStore.getEntity(config.azureFunctionStateTableName, 'checkpoint-monitoring', `${envName}-outdated-offsets`);
        return JSON.parse(entity.data);
    }
    catch (err) {
        if (err.statusCode !== 404) {
            console.log(err);
            throw err;
        }
        return [];
    }
}

async function saveOutdatedOffsets(newOutdatedOffsets, envName) {
    try {
        const entity = tableStore.createTableEntry('checkpoint-monitoring', `${envName}-outdated-offsets`, newOutdatedOffsets);
        await tableStore.upsertEntityIntoTableStore(config.azureFunctionStateTableName, entity);
    }
    catch (err) {
        console.log(err);
    }
}

function isCheckpointOutdated(checkpointDocument, partitionInfo) {
    if (partitionInfo.lastEnqueuedOffset == -1) {
        return false;
    }
    if (!checkpointDocument) {
        return true;
    }
    if (checkpointDocument.offset != partitionInfo.lastEnqueuedOffset) {
        const lastProcessedTimestamp = checkpointDocument.lastRecordCreatedTime
            ? moment(checkpointDocument.lastRecordCreatedTime) :
            moment.unix(checkpointDocument._ts);
        return moment(partitionInfo.lastEnqueuedTimeUtc).diff(lastProcessedTimestamp, 'seconds') > 900;
    }
    return false;
}

async function getCheckpointDocument(checkpointDetail, client, collectionUrl) {
    let querySpec = {
        query: 'SELECT * FROM root r WHERE r.dId = @dId and r.id = @id',
        parameters: [
            {
                name: '@id',
                value: checkpointDetail.documentId
            },
            {
                name: '@dId',
                value: null
            }
        ]
    };
    let queryOptions = {};
    queryOptions.partitionKey = null;
    queryOptions.populateQueryMetrics = true;

    return new Promise((resolve, reject) => {
        let iterator = client.queryDocuments(
            collectionUrl,
            querySpec,
            queryOptions
        );
        var resultCallback = async (error, results, obj) => {
            if (error) {
                reject(error);
            }
            else {
                let rusConsumed = obj['x-ms-request-charge'];
                let continuation = obj['x-ms-continuation'];
                resolve({ items: results || [], continuation });
            }
        }
        iterator.executeNext(resultCallback);
    });
}

function getDBClient(cosmos) {
    const connectionPolicy = new DocumentBase.ConnectionPolicy();
    if (lodash.startsWith(cosmos.endpoint.toLowerCase(), 'https://localhost:8081')) {
        connectionPolicy.DisableSSLVerification = true;
    }
    const client = new DocumentClient(cosmos.endpoint,
        { "masterKey": cosmos.key },
        connectionPolicy);
    return client;
}

async function getEventHubPartitionInfo(checkpointDetail) {
    const client = eventHub.EventHubClient.createFromConnectionString(checkpointDetail.eventHubNamespace, checkpointDetail.eventHub);
    const partitionInfo = await client.getPartitionInformation(checkpointDetail.partition);
    await client.close();
    return partitionInfo;
}

async function sendMail(mailBody) {
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

async function raisePagerDutyTrigger({ parsedResult, pagerDutyCriticalKey, pagerMessage, source }) {
    config.currentContext.log('sending pager duty trigger');
    let details = { details: parsedResult }
    let uri = 'https://events.pagerduty.com/v2/enqueue';
    let routing_key = pagerDutyCriticalKey;
    const payload = {
        summary: pagerMessage,
        severity: 'critical',
        custom_details: details,
        source: source
    }
    let options = {
        method: 'POST',
        uri,
        body: {
            routing_key,
            event_action: 'trigger',
            dedup_key: "Eh Lagging",
            payload
        },
        json: true
    };
    await rp(options);
}

module.exports = main
//startChecking(config.environments[0]);