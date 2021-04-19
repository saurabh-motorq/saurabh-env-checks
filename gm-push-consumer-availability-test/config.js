require('dotenv').config();
const config = {};

config.pushConsumers = [
	{
		name : "",
		url : ""
	}
],

config.serviceName = process.env.SERVICE_NAME || "InternalMonitoring";
config.contex = null;
config.availabilityTestRetryCount = parseInt(process.env.AVAILIBILITY_TEST_RETRY_COUNT) || 5;
config.maxBackOffTimeLimit = parseInt(process.env.MAX_BACKOFF_TIME_LIMIT) || 120;
config.pagerDutyCriticalKey = process.env.PAGER_DUTY_CRITICAL_KEY;
module.exports = config;
