const azureStorage = require("azure-storage");
const Promise = require("bluebird");
const config = require('../config');
const _ = require('lodash');
const entGen = azureStorage.TableUtilities.entityGenerator;
const retryPolicy = new azureStorage.LinearRetryPolicyFilter(60, 30);

const tableService = getTableService();

async function initaliseTable(tableName) {
    await createTableIfNotExists(tableName);
}

function getTableService() {
    let tableServiceToCreate = null;
    if (config.azureLocalStorage) {
        const devStoreCreds = azureStorage.generateDevelopmentStorageCredentials();
        tableServiceToCreate = azureStorage.createTableService(devStoreCreds).withFilter(retryPolicy);
    } else if(config.heartBeatTableStorageConnectionString){
        tableServiceToCreate = azureStorage.createTableService(config.heartBeatTableStorageConnectionString).withFilter(retryPolicy);
    } else {
        tableServiceToCreate = azureStorage.createTableService().withFilter(retryPolicy);
    }
    Promise.promisifyAll(tableServiceToCreate);
    return tableServiceToCreate;
}

function createTableIfNotExists(tableName) {
    return new Promise((resolve, reject) => {
        tableService.createTableIfNotExists(tableName, ((error, result) => {
            if (!error) {
                config.context.log({ message: `${tableName} Table exists or created` });
                resolve(result);
            } else {
                config.context.log({ exception: error });
                reject(error);
            }
        }));
    });
}

function createTableEntry(partitionKey, rowKey, propertiesAndValues) {
    const entry = {
        PartitionKey: entGen.String(partitionKey),
        RowKey: entGen.String(rowKey),
    };
    for (const property of Object.keys(propertiesAndValues)) {
        const value = propertiesAndValues[property];
        if (typeof value === "object") {
            throw new Error(`Unexpceted object for Property ${property}`);
        }
        entry[property] = value;
    }
    return entry;
}

async function upsertEntityIntoTableStore(table, entity) {
    try {
        await tableService.insertOrReplaceEntityAsync(table, entity);
        config.context.log({ message: `Entries upserted into ${table}, entity = ${JSON.stringify(entity)}` });
    } catch (err) {
        config.context.log({ exception: err });
        throw err;
    }
}

async function getEntity(tableName, partitionKey, rowKey) {
    try {
        const content = await tableService.retrieveEntityAsync(tableName, partitionKey, rowKey);
        config.context.log({ message: `Fetched entity in ${tableName} table with rowkey=${rowKey} and parititionkey=${partitionKey}` });
        return parseTableEntry(content);
    } catch (err) {
        config.context.log({ exception: err });
        return null;
    }
}

function getDataFromTableEntry(tableEntry) {
    try {
        return JSON.parse(tableEntry.data);
    }
    catch (err) {
        config.context.log({ exception: `Invalid format while deserializing data field in ${tableEntry}` })
        throw err;
    }
}

function parseTableEntry(tableEntry) {
	try {
		return _.mapValues(tableEntry, entry => entry._);
	} catch (err) {
		config.context.log({ exception: `Invalid format while deserializing data field in ${tableEntry}` });
		throw err;
	}
}

async function getEntityByPartitionKey(tableName, parititionkey, whereConditions, propertiesToSelect) {
    let entries = [];
    let contToken = null;
    try {
        let query = new azureStorage.TableQuery();
        if (propertiesToSelect) {
            query = query.select(propertiesToSelect);
        } else {
            query = query.select();
        }
        query = query.where("PartitionKey eq ?", parititionkey);
        for (const condition of whereConditions) {
            query = query.and(`${condition.columnName} ${condition.type} ?`, condition.value)
        }
        do {
            const response = await tableService.queryEntitiesAsync(tableName, query, contToken)
            contToken = response.continuationToken
            entries = entries.concat(response.entries.map(parseTableEntry))
        } while (contToken)
        return entries;
    }
    catch (err) {
        config.context.log({ exception: err });
        throw err;
    }
}

function parseTableEntry(tableEntry) {
    try {
        return _.mapValues(tableEntry, entry => entry._);
    } catch (err) {
        config.context.log({ exception: `Invalid format while deserializing data field in ${tableEntry}` });
        throw err;
    }
}

module.exports = {
    initaliseTable, createTableEntry, upsertEntityIntoTableStore, getEntity, getDataFromTableEntry,getEntityByPartitionKey
}