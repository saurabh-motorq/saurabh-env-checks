const enviroment = {
	"name": "MOTORQ_INTERNAL_STABLE",
	"infra": {
		"ai": {
			"id": process.env.MOTORQ_INTERNAL_STABLE_APP_ID,
			"key": process.env.MOTORQ_INTERNAL_STABLE_APP_KEY
		},
		"eh": {
			"event_hub_namespace": process.env.MOTORQ_INTERNAL_STABLE_EVENT_HUB_NAMESPACE,
			"calamp_event_hub_namespace": process.env.MOTORQ_INTERNAL_STABLE_EVENT_HUB_NAMESPACE,
			"calamp_event_hub": "calamporderedmessages",
			"calamp_event_hub_partition_count": "1",
			"calamp_unbuffered_event_hub": "calamporderedmessages",
			"calamp_unbuffered_event_hub_partition_count": "1",
			"toyota_event_hub_namespace": process.env.MOTORQ_INTERNAL_STABLE_EVENT_HUB_NAMESPACE,
			"toyota_event_hub": "toyotaorderedmessages",
			"toyota_event_hub_partition_count": "2",
			"toyota_unbuffered_event_hub": "toyotaorderedmessagesunbuffered",
			"toyota_unbuffered_event_hub_partition_count": "2",
			"telematics_postprocessor_eventhub_namespace": process.env.MOTORQ_INTERNAL_STABLE_EVENT_HUB_NAMESPACE,
			"telematics_postprocessor_eventhub": "feedmessages",
			"telematics_postprocessor_event_hub_partition_count": "2"
		},
		"cosmos": {
			"key": process.env.MOTORQ_INTERNAL_STABLE_COSMOS_KEY,
			"endpoint": "https://motorq-internal-dev-eus2-serverless.documents.azure.com:443/",
			"db": "core-fleet-internal-stable"
		},
		"pager": {
			"criticalKey": process.env.PAGER_MOTORQ_INTERNAL_STABLE_CRITICAL_KEY
		},
		"pg": {},

		"storage": {},
		"auth0": {}
	},
	"components": {
		"calamp": {
			"calamp-poller": {
				"instanceCount": 1
			},
			"core-calamp-processor": {
				"instanceCount": 1
			},
			"core-calamp-latest-processor": {
				"instanceCount": 1
			}
		},
		"common": {
			"cosmosdb-eventhub-sync": {},
			"telematics-postprocessor": {
				"instanceCount": 1
			},
			"weatherbit-poller": {
				"instanceCount": 1
			}
		},
		"toyota": {
			"core-toyota-latest-processor": {
				"instanceCount": 2
			},
			"core-toyota-processor": {
				"instanceCount": 2
			},
			"toyota-filterer-unbuffered": {
				"instanceCount": 2
			},
			"toyota-filterer-bufferer": {
				"instanceCount": 2
			}
		}
	},
	"disabledHeartbeats": [
		"Trips fetch heartbeat",
		"Trips push heartbeat",
		"lat/lon sync heartbeat"
	]
}
module.exports = enviroment