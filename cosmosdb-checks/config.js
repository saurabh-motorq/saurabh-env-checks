require('dotenv').config();
let config = {};
config.endpoint = process.env.DOCDB_ENDPOINT;
config.key = process.env.DOCDB_ACCESS_KEY_READ_ACCESS;

config.database = {
	'id': process.env.DOCDB_NAME || 'core-fleet'
};
config.collection = {
	'entitiesId': process.env.DOCDB_ENTITIES_COLLECTION || 'entities',
	'telematicsId': process.env.DOCDB_TELEMATICS_COLLECTION || 'telematics'
};

config.pgUser = process.env.PG_SAURABH_TEST_USER;
config.pgHost = process.env.PG_SAURABH_TEST_HOST;
config.pgDatabase = process.env.PG_SAURABH_TEST_DBNAME;
config.pgPassword = process.env.PG_SAURABH_TEST_USER_PASSWORD;
config.pgPort = process.env.PG_SAURABH_TEST_PORT;
config.sslmode = process.env.PG_SAURABH_TEST_SSLMODE;
module.exports = config;