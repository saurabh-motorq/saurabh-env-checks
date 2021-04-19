require("dotenv").config();
let config = {};

config.appId = "";
config.key = "";
config.restartLimit = 2;
config.pagerDutyCriticalKey = process.env.PAGER_DUTY_CRITICAL_KEY;
config.timespan = "15m";

module.exports = config;