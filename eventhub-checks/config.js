require('dotenv').config();
let config = {};

config.pgUser = process.env.PG_SAURABH_TEST_USER;
config.pgHost = process.env.PG_SAURABH_TEST_HOST;
config.pgDatabase = process.env.PG_SAURABH_TEST_DBNAME;
config.pgPassword = process.env.PG_SAURABH_TEST_USER_PASSWORD;
config.pgPort = process.env.PG_SAURABH_TEST_PORT;
config.sslmode = process.env.PG_SAURABH_TEST_SSLMODE;
config.ehApiVersion = process.env.PG_SAURABH_TEST_EH_API_VERSION;
config.cosmos_event_hub_time_diff_in_seconds = 3600;
config.capture_enable_timegrain = 'PT6H';
config.data_ingress_check_timegrain = 'PT24H';
module.exports = config;