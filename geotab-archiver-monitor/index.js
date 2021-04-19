const rp = require('request-promise');
const config = require('./config');
const moment = require('moment');
const _ = require('lodash');

module.exports = async function (context, myTimer) {
	context.log('Starting heart rate monitor');
	let heartbeatFailures = [];
	let failuresForMessageCount = [];
	for (let queryConfig of config.queryConfigs) {
		heartbeatFailures.push(...await getHeartbeatFailures(queryConfig, context));
		if (!(await areMessagesGettingArchived(queryConfig, context))) {
			failuresForMessageCount.push({
				accountId: queryConfig.accountId,
				accountName: queryConfig.accountName,
				timespan: queryConfig.timespan
			});
		}
	}
	if (heartbeatFailures.length) {
		let mailBodyHtml = composeMailBody(heartbeatFailures);
		console.log("MailBody is " + mailBodyHtml);
		await mail({ htmlBody: mailBodyHtml, body: mailBodyHtml, subject: config.heartbeatMailSubject });
		// await raisePagerDutyTrigger(mailBodyHtml, context);
		context.log(`Heartbeat check failed for ${heartbeatFailures.length}`)
	}
	else {
		context.log('Heartbeat active')
	}

	if (failuresForMessageCount.length) {
		let mailBodyHtml = composeMailBodyForNotArchivingMessages(failuresForMessageCount);
		console.log("MailBody is " + mailBodyHtml)
		await mail({ htmlBody: mailBodyHtml, body: mailBodyHtml, subject: config.notArchivingMailSubject });
		// await raisePagerDutyTriggerForNotArchvingMessages(mailBodyHtml, context);
		context.log(`Failed for ${JSON.stringify(failuresForMessageCount)} accounts`)
	}
};

async function getHeartbeatFailures(queryConfig, context) {
	let uri = 'https://api.applicationinsights.io/v1/apps/' + config.appId + '/query';
	let archiverTypes = [
		{ name: "feed-archiver", timespan: "90m" },
		{ name: "diagnostic-archiver", timespan: "26hr" },
		{ name: "device-archiver", timespan: "26hr" }
	];
	let heartbeatFailures = [];
	for (const archiverType of archiverTypes) {
		let query = constructAppInsightsCountEventsQuery(`${queryConfig.accountId} ${archiverType.name} heartbeat`, archiverType.timespan, context);
		let options = {
			uri: uri,
			qs: {
				timespan: archiverType.timespan,
				query: query
			},
			headers: {
				'x-api-key': config.apiKey
			},
			json: true
		};
		let res = await rp(options);
		if (isHeartBeatDown(res)) {
			let diffTime = parseInt(archiverType.timespan);
			let unit;
			if (archiverType.timespan.includes('m')) {
				unit = 'minutes';
			} else {
				unit = 'hours';
			}
			let failureTimestamp = moment().subtract(diffTime, unit).toISOString();
			heartbeatFailures.push({
				envName: queryConfig.accountName,
				failureTimestamp,
				type: archiverType.name
			});
		}
	}
	return heartbeatFailures;
}

async function areMessagesGettingArchived(queryConfig, context) {
	let uri = 'https://api.applicationinsights.io/v1/apps/' + config.appId + '/query';
	let queryForMessageCount = constructAppInsightsSumMetricsQuery(`${queryConfig.accountId}-messageCount-archiver`, queryConfig.timespan, context);
	let options = {
		uri: uri,
		qs: {
			timespan: queryConfig.timespan,
			query: queryForMessageCount
		},
		headers: {
			'x-api-key': config.apiKey
		},
		json: true
	};
	let res = await rp(options);
	return res.tables[0].rows[0][0] > 0;
}

function constructAppInsightsCountEventsQuery(searchKey, timeStampAgo, context) {
	let query = 'customEvents ';
	query += `| where timestamp  > ago(${timeStampAgo}) `
	query += `| where name contains '${searchKey}' `;
	query += `| summarize count(timestamp)`;
	context.log(query);
	return query;
}

function constructAppInsightsSumMetricsQuery(searchKey, timeStampAgo, context) {
	let query = 'customMetrics ';
	query += `| where timestamp  > ago(${timeStampAgo}) `
	query += `| where name contains '${searchKey}' `;
	query += `| summarize count()`;
	context.log(query);
	return query;
}

function composeMailBody(failures) {
	let mailBodyHtml = '<strong> Below webjobs have some problem with their heartbeats</strong><br>'
	if (failures.length) {
		for (let failure of failures) {
			mailBodyHtml += `<li> ${failure.envName} after ${failure.failureTimestamp}</li> for ${failure.type}`
		}
	}
	return mailBodyHtml;
}

function composeMailBodyForNotArchivingMessages(failures) {
	let mailBodyHtml = '<strong> Below accounts havent archived messages</strong><br>'
	if (failures.length) {
		for (let failure of failures) {
			mailBodyHtml += `<li> ${failure.accountId} - ${failure.accountName} atleast for past ${failure.timespan} </li>`;
		}
	}
	return mailBodyHtml;
}


async function raisePagerDutyTrigger(parsedResult, context) {
	context.log('sending pager duty trigger');
	let details = { details: parsedResult }
	let uri = 'https://events.pagerduty.com/generic/2010-04-15/create_event.json';
	let service_key = config.pagerDutyCriticalKey;
	let options = {
		method: 'POST',
		uri,
		body: {
			service_key,
			event_type: 'trigger',
			description: `HeartBeats missing. Please check pager duty details`,
			incident_key: "HeartBeat Misisng",
			details: details
		},
		json: true
	};
	await rp(options);
}

async function raisePagerDutyTriggerForNotArchvingMessages(parsedResult, context) {
	context.log('sending pager duty trigger');
	let details = { details: parsedResult }
	let uri = 'https://events.pagerduty.com/generic/2010-04-15/create_event.json';
	let service_key = config.pagerDutyCriticalKey;
	let options = {
		method: 'POST',
		uri,
		body: {
			service_key,
			event_type: 'trigger',
			description: `Geotab Archiver not archiving messages`,
			incident_key: "Geotab Archiver not archiving messages",
			details: details
		},
		json: true
	};
	await rp(options);
}


function mail({
	fileName,
	fileType,
	fileContents,
	body,
	htmlBody,
	subject
}) {
	let options = {
		method: 'POST',
		uri: config.mailerUrl,
		body: {
			"from": config.mailFrom,
			"to": config.mailTo,
			"subject": subject,
			"text": body,
			"html": htmlBody,
			"b64": fileContents,
			"fileName": fileName,
			"fileType": fileType
		},
		json: true
	};
	console.log(htmlBody);
	rp(options);
}

function isHeartBeatDown(res) {
	return res.tables[0].rows[0][0] == 0;
}