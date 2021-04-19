require('dotenv').config();
let config = {};

config.query = 'exceptions | summarize count() by  type, assembly, outerMessage, innermostMessage,tostring(customDimensions)';
config.timespan = 'PT12H'
config.appInsightConfigs = [
	{
		'appId': "",
		'key': "",
		'name': ""
	}
]
//config.mailerUrl = 'https://motorq-monitoring.azurewebsites.net/api/mail-helper?code=ugOXHufAjyeOGNBSbjAVoeQjEkhHa1XgNNIekdbV6rOsWs404cIbHQ==';
config.mailerUrl = process.env.MAILER_URL
config.mailFrom = 'automatedtest@Motorq.co';
config.mailTo = 'servicealerts@motorq.co';
config.mailSubject = 'Motorq Error Aggregate';
config.mailText = 'Aggregate of error logs for past 12 hours of  production , sunpower production and motorq Qa';

module.exports = config;