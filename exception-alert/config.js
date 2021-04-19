require('dotenv').config();
let config = {};

config.query = 'exceptions | summarize count() by  type, assembly, outerMessage, innermostMessage,tostring(customDimensions)';
config.timespan = 'PT20M'
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
config.mailSubject = 'Priority Error Alerts';
config.mailText = 'Priority Error Alerts for qa and prod';
config.excludedKeyWords = [
	'ECONNRESET',
	'jwt expired',
	'socket hang up',
	'specified message does not exist',
	'Unexpceted object for Property fleet'
]
config.excludedExceptionCount = 50;
config.exceptionCount = 10;
config.exclusionTable = process.env.EXCEPTION_EXCULSION_TABLE || 'erroralertexclusions1';
config.storageConnectionString = process.env.STORAGE_CONNECTION_STRING;
config.exceptionGroupingTable = process.env.EXCEPTION_GROUPING_TABLE || 'errorgroups'
config.context = null;
module.exports = config;