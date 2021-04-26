require('dotenv').config();
let config = {};

config.pgUser = process.env.PG_SAURABH_TEST_USER;
config.pgHost = process.env.PG_SAURABH_TEST_HOST;
config.pgDatabase = process.env.PG_SAURABH_TEST_DBNAME;
config.pgPassword = process.env.PG_SAURABH_TEST_USER_PASSWORD;
config.pgPort = process.env.PG_SAURABH_TEST_PORT;
config.sslmode = process.env.PG_SAURABH_TEST_SSLMODE;

module.exports = config;