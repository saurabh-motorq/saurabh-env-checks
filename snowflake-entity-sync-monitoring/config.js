require('dotenv').config();
let config = {};
config.pagerDutyCriticalKey = ""
config.SyncThresholdInSeconds = 60 * 60 * 24 * 2; // two days
config.account = process.env.SNOWFLAKE_ACCOUNT
config.username = process.env.SNOWFLAKE_USERNAME
config.password = process.env.SNOWFLAKE_PASSWORD
config.environmentConfigs = [{
    cosmos : {
        envName: "",
        endpoint: "",
	    primaryKey: "",
	    database: "" || 'core-fleet',
        entitiesId: "" 
    },
    snowflake: {
        database: 'MOTORQ',
        schema: 'DS_PROD_DATA'
    }
}]


module.exports = config;