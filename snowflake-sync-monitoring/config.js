require('dotenv').config();
let config = {};
config.pagerDutyNonCriticalKey = process.env.PAGER_DUTY_CRITICAL_KEY;
config.SyncThresholdInSeconds = 60 * 60 * 2;
config.account = process.env.SNOWFLAKE_ACCOUNT
config.username = process.env.SNOWFLAKE_USERNAME
config.password = process.env.SNOWFLAKE_PASSWORD


module.exports = config;