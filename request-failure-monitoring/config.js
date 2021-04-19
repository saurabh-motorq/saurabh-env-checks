require('dotenv').config();
let config = {};

config.envs = [
	{
		name : "",
		appId : "",
		key : "",
		count : ""
	}
]
config.timespan = '10m';
config.pagerDutyCriticalKey = process.env.PAGER_DUTY_CRITICAL_KEY;

module.exports = config;