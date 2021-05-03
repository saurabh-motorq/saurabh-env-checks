require('dotenv').config();
let config = {};

config.pgUser = process.env.PG_SAURABH_TEST_USER;
config.pgHost = process.env.PG_SAURABH_TEST_HOST;
config.pgDatabase = process.env.PG_SAURABH_TEST_DBNAME;
config.pgPassword = process.env.PG_SAURABH_TEST_USER_PASSWORD;
config.pgPort = process.env.PG_SAURABH_TEST_PORT;
config.sslmode = process.env.PG_SAURABH_TEST_SSLMODE;

config.storageConnectionString = process.env.STORAGE_SAURABH_TEST_CONNECTION_STRING;
config.containerName = process.env.SAURABH_TEST_CONTAINER_NAME;
module.exports = config;