require('dotenv').config();
let config = {};
config.unenrollmentQuery = 'requests | where name contains "enrollments" and name contains "delete" | summarize count()';
config.enrollmentQuery = 'requests | where name contains "enrollments" and name contains "post" | summarize count()';
config.timespan = 'PT35M';
config.appInsightConfigs = [
	{
		'appId': "",
		'key': "",
		'name': "",
		pagerDutyCriticalKey: "",
        pagerMessage: "Enrollment Alert",
        enrollmentLimit : 100
	}
]
config.mailerUrl = process.env.MAILER_URL
config.mailFrom = 'automatedtest@Motorq.co',
	config.mailTo = 'servicealerts@motorq.co',
	config.mailSubject = 'Priority Error Alerts',
	config.mailText = 'Priority Error Alerts for qa and prod',
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
config.context = null;
module.exports = config;