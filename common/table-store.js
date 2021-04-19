const azureStorage = require('azure-storage');
const entGen = azureStorage.TableUtilities.entityGenerator;
const Promise = require('bluebird');
const _ = require('lodash');

const retryOperations = new azureStorage.LinearRetryPolicyFilter(6000, 5);
let tableService = null;

function init(azureLocalStorage, connectionString) {
    tableService = getTableService(azureLocalStorage, connectionString);
}

function createTableIfNotExists(tableName) {
    return new Promise((resolve, reject) => {
        tableService.createTableIfNotExists(tableName, ((error, result) => {
            if (!error) {
                resolve(result);
            } else {
                reject(error);
            }
        }));
    });
}

function getTableService(azureLocalStorage, connectionString) {
    let tableService = null;
    if (azureLocalStorage) {
        let devStoreCreds = azureStorage.generateDevelopmentStorageCredentials();
        tableService = azureStorage.createTableService(devStoreCreds).withFilter(retryOperations);
    } else {
        tableService = azureStorage.createTableService(connectionString).withFilter(retryOperations);
    }
    Promise.promisifyAll(tableService);
    return tableService;
}

async function mergeEntityIntoTableStore(tableName, data) {
    await tableService.mergeEntityAsync(tableName, data);
}

function createTableEntry(partitionKey, rowKey, data, columns) {
    const entry = {
        PartitionKey: entGen.String(partitionKey),
        RowKey: entGen.String(rowKey),
        data: JSON.stringify(data)
    };
    if (columns) {
        for (let key of Object.keys(columns)) {
            entry[key] = columns[key];
        }
    }
    if (!data) {
        delete entry.data;
    }
    return entry;
}

async function upsertEntityIntoTableStore(table, entity) {
    await tableService.insertOrReplaceEntityAsync(table, entity);
}

async function getEntity(tableName, partitionKey, rowKey) {
    const content = await tableService.retrieveEntityAsync(tableName, partitionKey, rowKey);
    return parseTableEntry(content);
}



function parseTableEntry(tableEntry) {
    return _.mapValues(tableEntry, entry => entry._);
}

module.exports = {
    init,
    createTableIfNotExists,
    getTableService,
    mergeEntityIntoTableStore,
    createTableEntry,
    upsertEntityIntoTableStore,
    getEntity
}