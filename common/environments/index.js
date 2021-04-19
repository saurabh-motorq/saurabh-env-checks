require('dotenv').config();
const { components: componentsMasterList } = require('../components');
const _ = require('lodash');
const fs = require('fs');
const devLocal = require('./dev-local');

const environments = [];

if (process.env.NODE_ENV == "dev") {
	environments.push(devLocal)
} else {

	for (const file of fs.readdirSync(__dirname)) {
		const fileName = file.split('.')[0];
		if (!['index', 'dev-local'].includes(fileName)) {
			environments.push(require(`${__dirname}/${fileName}`));
		}
	}
}

const pushConsumers = [];
const heartbeatConfigs = [];
const appInsightConfigs = [];

main();

function main() {
	setCosmosDefaults();
	setHeartBeats();
	setAppInsightConfigs();
	setEventHubDocumentIds();
	setPushConsumers();
}

function setCosmosDefaults() {
	for (const env of environments) {
		env.infra.cosmos.db = env.infra.cosmos.db || 'core-fleet';
		env.infra.cosmos.telematicsId = env.infra.cosmos.telematicsId || 'telematics';
		env.infra.cosmos.entitiesId = env.infra.cosmos.entitiesId || 'entities';
		env.infra.cosmos.referenceDataId = env.infra.cosmos.referenceDataId || 'reference-data';
		env.infra.cosmos.sessionDataId = env.infra.cosmos.sessionDataId || 'session-data';
	}
}

function setPushConsumers() {
	for (const env of environments) {
		if (env.components.gm && env.components.gm['gm-push-consumer']) {
			pushConsumers.push({ url: env.components.gm['gm-push-consumer'].url, name: env.name })
		} else if (env.components.toyota && env.components.toyota['toyota-collision-subscription']) {
			pushConsumers.push({ url: env.components.toyota['toyota-collision-subscription'].url, name: env.name })
		}
	}
}

function setEventHubDocumentIds() {
	for (const env of environments) {
		env.eventHubDocumentIds = getEventHubDocumentsForEnv(env)
	}
}

function setHeartBeats() {
	for (const env of environments) {
		for (const groupName of Object.keys(env.components)) {
			const componentNames = Object.keys(env.components[groupName])
			componentNames.forEach(componentName => {
				const component = env.components[groupName][componentName]
				const heartbeatRules = componentsMasterList[groupName][componentName].heartbeats;
				if (heartbeatRules) {
					if (component.instanceCount) {
						for (let instance = 0; instance < component.instanceCount; instance++) {
							addheartbeats(env, heartbeatRules, componentName, component.queryTablestore, instance);
						}
					} else if (component.entitiesList) {
						for (const entity of component.entitiesList) {
							addheartbeats(env, heartbeatRules, componentName, component.queryTablestore, entity);
						}
					} else {
						addheartbeats(env, heartbeatRules, componentName, component.queryTablestore);
					}
				}
			})
		}
	}
}

function setAppInsightConfigs() {
	for (const env of environments) {
		appInsightConfigs.push({
			name: env.name,
			appId: env.infra.ai.id,
			key: env.infra.ai.key
		});
	}
}

function addheartbeats(env, heartbeatRules, componentName, queryTablestore, instance) {
	for (const rule of heartbeatRules) {
		const ignore = env.disabledHeartbeats.some(item => rule.searchKey.includes(item))
		if (!ignore) {
			let searchKey = null;
			let componentInstanceName = null;
			if (_.isNil(instance)) {
				searchKey = rule.searchKey.replace("-__id", '');
				componentInstanceName = componentName;
			} else {
				searchKey = rule.searchKey.replace("__id", instance);
				componentInstanceName = `${componentName}-${instance}`;
			}
			heartbeatConfigs.push({
				name: `${componentInstanceName}-${env.name}`,
				cloudRoleName: componentInstanceName,
				searchKey,
				envName: env.name,
				timespan: rule.timespan || "25m",
				appId: env.infra.ai.id,
				apiKey: env.infra.ai.key,
				pagerDutyCriticalKey: env.infra.pager.criticalKey,
				pagerMessage: `Heartbeat Missing for ${env.name}`,
				queryTablestore: queryTablestore
			});
		}
	}
}

function getEventHubDocumentsForEnv(env) {
	const eventHubDocumentIds = [];

	Object.keys(env.components).forEach(groupName => {

		Object.keys(env.components[groupName]).forEach(componentName => {
			const component = env.components[groupName][componentName];
			const ehRule = componentsMasterList[groupName][componentName].eh;
			if (ehRule) {
				const results = getEventHubDocuments({
					eventHubNamespace: env.infra.eh[ehRule.ns],
					eventHub: env.infra.eh[ehRule.name] || ehRule.defaultName,
					instanceCount: component.instanceCount,
					documentId: ehRule.checkpoint
				});
				eventHubDocumentIds.push(...results);
			}

		});

	});
	return eventHubDocumentIds;
}

function getEventHubDocuments({
	eventHubNamespace,
	eventHub,
	instanceCount,
	documentId
}) {
	const results = [];
	for (let instance = 0; instance < instanceCount; instance++) {
		results.push({
			eventHubNamespace,
			eventHub,
			partition: instance,
			documentId: documentId.replace("__id", instance).replace("__ehname__", eventHub)
		});
	}
	return results;
}

module.exports = { environments, pushConsumers, heartbeatConfigs, appInsightConfigs }