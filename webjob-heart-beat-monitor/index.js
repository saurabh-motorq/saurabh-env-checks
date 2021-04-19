const rp = require('request-promise');
const config = require('./config');
const { heartbeatConfigs } = require('../common/environments')
const moment = require('moment');
const _ = require('lodash');
const retry = require('async-retry');
const tableStorage = require('./shared/table-storage');

let tableStoreCache = {}

async function main(context, myTimer) {
	config.context = context;
	config.context.log('Starting heart rate monitor');
	let failures = [];
	let monitoringFailures = [];
	tableStoreCache = {}
	for (let heartbeatConfig of heartbeatConfigs) {
		try{
			config.context.log(`${heartbeatConfig.name}`);
			name = heartbeatConfig.name;
			let heartBeats = null;
			if (heartbeatConfig.queryTablestore === false) {
				let query = constructAppInsightsQuery(heartbeatConfig.searchKey, heartbeatConfig.cloudRoleName, heartbeatConfig.timespan);
				heartBeats = await retry(async() => {
					return await getHeartBeats(heartbeatConfig, query);
				}, {retries: config.appInsightsRetryLimit});
				heartBeatDown = isHeartBeatDown(heartBeats)
			}
			else {
				heartBeats = await getHeartBeatFromTableStore(heartbeatConfig.envName, heartbeatConfig.searchKey)
				heartBeatDown = isHeartBeatDown(heartBeats, true, heartbeatConfig.timespan)
			}

			if (heartBeatDown) {
				let diffTime = parseInt(heartbeatConfig.timespan.slice(0, -1));
				let failureTimestamp = moment().subtract(diffTime, _.last(heartbeatConfig.timespan)).toISOString();
				failures.push({
					envName: heartbeatConfig.name,
					heartbeatName: heartbeatConfig.searchKey,
					failureTimestamp,
					pagerDutyCriticalKey: heartbeatConfig.pagerDutyCriticalKey,
					pagerMessage: heartbeatConfig.pagerMessage,
					source: heartbeatConfig.pagerMessage.split('for')[1].trim()  // this is a temporary hack for testing
				});
			}
		} catch(err) {
			config.context.log(`Heartbeat monitoring failed for ${heartbeatConfig.name} due to ${JSON.stringify(err)}`)
			monitoringFailures.push({
				envName: heartbeatConfig.name
			})
		}
	}
	if (failures.length || monitoringFailures.length) {
		let mailBodyHtml = composeMailBody(failures, monitoringFailures);
		context.log(mailBodyHtml)
		mail({ htmlBody: mailBodyHtml, body: mailBodyHtml });
		monitoringFailures = [];
		for (let failure of failures) {
			try {
				await raisePagerDutyTrigger(mailBodyHtml, failure.pagerDutyCriticalKey, failure.pagerMessage, failure.source);
			}
			catch(err) {
				monitoringFailures.push({
					envName: failure.envName
				})
			}
		}
		if(monitoringFailures.length) {
			mailBodyHtml = composeMailBody([], monitoringFailures);
			mail({ htmlBody: mailBodyHtml, body: mailBodyHtml });
		}
	}
	else {
		config.context.log('Heartbeat active')
	}
};

async function getHeartBeatFromTableStore(envName, searchKey) {
	if(!tableStoreCache[envName]) {
		entries = await retry(async() => {
			return await tableStorage.getEntitiesByPartitionKey(config.heartBeatTable, envName);
		}, {retries: config.tableStoreRetryLimit});
		tableStoreCache[envName] = {}
		for (const entry of entries) {
			tableStoreCache[envName][entry["RowKey"]] = entry
		}
	} 
	return tableStoreCache[envName][searchKey]
}


async function getHeartBeats(heartbeatConfig, query) {
	let uri = 'https://api.applicationinsights.io/v1/apps/' + heartbeatConfig.appId + '/query';
	let options = {
		uri: uri,
		qs: {
			timespan: heartbeatConfig.timespan,
			query: query
		},
		headers: {
			'x-api-key': heartbeatConfig.apiKey
		},
		json: true
	};
	let res = await rp(options);
	return res;
}

function constructAppInsightsQuery(searchKey, cloudRoleName, timeStampAgo) {
	let query = 'customEvents ';
	query += `| where cloud_RoleName == '${cloudRoleName}' `;
	query += `| where timestamp  > ago(${timeStampAgo}) `
	query += `| where name contains '${searchKey}' `;
	query += `| summarize count(timestamp)`;
	config.context.log(query);
	return query;
}

function isHeartBeatDown(heartbeat, tableStorage, timespan) {
	if (tableStorage) {
		if (!heartbeat) {
			return true;
		}
		const timediff = Number(timespan.slice(0, -1)) || 25
		return moment().diff(moment(heartbeat.Timestamp), 'm') > timediff
	}
	else {
		return heartbeat.tables[0].rows[0][0] == 0;
	}
}

function composeMailBody(failures, monitoringFailures) {
	let mailBodyHtml = '<strong> Below webjobs have some problem with their heartbeats</strong><br>'
	if (failures.length) {
		for (let failure of failures) {
			mailBodyHtml += `<li> ${failure.envName} ${failure.heartbeatName} after ${failure.failureTimestamp}</li>`
		}
	}
	if(monitoringFailures.length) {
		for (let failure of monitoringFailures) {
			mailBodyHtml += `<li> Heartbeat monitoring for ${failure.envName} failed </li>`
		}
	}	
	return mailBodyHtml;
}

async function raisePagerDutyTrigger(parsedResult, pagerDutyCriticalKey, pagerMessage, source) {
	config.context.log('sending pager duty trigger');
	let details = { details: parsedResult }
	let uri = 'https://events.pagerduty.com/v2/enqueue';
	let routing_key = pagerDutyCriticalKey;
	const payload = {
		summary: pagerMessage,
		severity: 'critical',
		custom_details: details,
		source: source
	}
	let options = {
		method: 'POST',
		uri,
		body: {
			routing_key,
			event_action: 'trigger',
			dedup_key: "HeartBeat Misisng",
			payload
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
	htmlBody
}) {
	let options = {
		method: 'POST',
		uri: config.mailerUrl,
		body: {
			"from": config.mailFrom,
			"to": config.mailTo,
			"subject": config.mailSubject,
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

module.exports = main