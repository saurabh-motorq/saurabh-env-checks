const config = require('./config');
const _ = require('lodash');
const {DocumentClient,DocumentBase} = require('documentdb');

class DataStore {

	constructor	(endpoint, primaryKey, database, collection) {
		const connectionPolicy = new DocumentBase.ConnectionPolicy();
		if (_.startsWith(endpoint.toLowerCase(), 'https://localhost:8081')) {
			connectionPolicy.DisableSSLVerification = true;
		}


		this.client = new DocumentClient(endpoint, {
			"masterKey": primaryKey
		},
		connectionPolicy);
		const databaseUrl = `dbs/${database.id}`;
		this.telematicsCollectionUrl = `${databaseUrl}/colls/${collection.telematicsId}`;
		this.entitiesCollectionUrl = `${databaseUrl}/colls/${collection.entitiesId}`;
		this.sessionDataCollectionUrl = `${databaseUrl}/colls/${collection.sessionDataId}`;
	}

	async getGeotabSessionData(database) {
		try {
			let querySpec = {
				query: `SELECT * FROM root r WHERE r.type = 'SESSION' AND r.database = @database`,
				parameters: [
					{
						name: "@database",
						value: database						
					}
				]
			}
			let isEntity = false;
			let results = await this.query(querySpec, null, isEntity);
			if(results && results.length){
				return results[0];
			} else {
				return {};
			}
		}
		catch(err) {
			console.log(JSON.stringify(err));
			return {};
		}
	}

	async getGeotabPollerCheckpoints() {
		try{
			let querySpec = {
				query: `SELECT * FROM root r WHERE r.type='OFFSETCHECKPOINT'`
			}
			let isEntity = false;
			let results = await this.query(querySpec, null, isEntity);
			if(results && results.length){
				return results;
			}
		}
		catch(err){
			console.log(JSON.stringify(err));
			return [];
		}
	}

	async _query(querySpec, enableCrossPartitionQuery, dId, collectionUrl) {
		let queryOptions = {
			enableCrossPartitionQuery
		};
		if (!enableCrossPartitionQuery) {
			queryOptions.partitionKey = dId;
		}
		let continuation = null;
		let items = [];
		do {
			queryOptions.continuation = continuation;
			let result = await this.getNextResult(querySpec, queryOptions, collectionUrl);
			items = items.concat(result.items);
			continuation = result.continuation;
		} while (continuation);
		return items;
	}

	async getNextResult(querySpec, queryOptions, collectionUrl) {
		console.log({ message: JSON.stringify({ querySpec, queryOptions }) });
		return new Promise((resolve, reject) => {
			let iterator = this.client.queryDocuments(
				collectionUrl,
				querySpec,
				queryOptions
			);
			var resultCallback = async (error, results, obj) => {
				if (error) {
					console.log(JSON.stringify(error));
					reject(error);
				}
				else {
					let continuation = obj['x-ms-continuation'];
					resolve({ items: results || [], continuation });
				}
			}
			iterator.executeNext(resultCallback);
		});
	}

	async query(querySpec, dId, isEntity, collection = this.telematicsCollectionUrl) {
		let enableCrossPartitionQuery = false;
		let collectionUrl = isEntity ? this.entitiesCollectionUrl : collection
		let result = await this._query(querySpec, enableCrossPartitionQuery, dId, collectionUrl)
		return result;
	}



}


module.exports = { DataStore };