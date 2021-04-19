require('dotenv').config();
const config = {};
config.endpoint = process.env.DOCDB_ENDPOINT;
config.primaryKey = process.env.DOCDB_ACCESS_KEY_FULL_ACCESS;

config.database = {
	'id': process.env.DOCDB_NAME || 'core-fleet'
};
config.collection = {
	'entitiesId': process.env.DOCDB_ENTITIES_COLLECTION || 'entities',
	'telematicsId': process.env.DOCDB_TELEMATICS_COLLECTION || 'telematics'
};
module.exports = config;