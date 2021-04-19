require("dotenv").config();
let config = {};

config.envs = [
	{
		name:"",
		baseUrl : "",
		indexPagePath : "index.html"
	}
]

config.serviceName = process.env.SERVICE_NAME || "InternalMonitoring";
config.context=null;
config.mailerUrl = process.env.MAILER_URL;
config.mailFrom = "automatedtest@Motorq.co";
config.mailTo = "servicealerts@motorq.co";
config.mailSubject = "FMCA Alerts";
config.mailText = "FMCA Alerts";
config.pagerDutyCriticalKey = process.env.PAGER_DUTY_CRITICAL_KEY;
config.fmcaCheckRetry = process.env.FMCA_CHECK_RETRY || 3;

module.exports = config;