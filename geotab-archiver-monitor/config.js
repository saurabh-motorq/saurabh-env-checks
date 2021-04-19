require("dotenv").config();
let config = {};

config.appId = "";
config.apiKey = "";
config.queryConfigs = [
	{
		"accountName": "",
		"accountId": "",
		"timespan": ""
	}
];
config.mailerUrl = process.env.MAILER_URL;
config.mailFrom = "automatedtest@Motorq.co";
config.mailTo = "servicealerts@motorq.co";
config.heartbeatMailSubject = "Webjob HeartBeat Alert";
config.notArchivingMailSubject = "Messages not getting archived Alert";
config.mailText = "Heartbeat alert for production";
config.pagerDutyCriticalKey = process.env.PAGER_DUTY_CRITICAL_KEY;

module.exports = config;
