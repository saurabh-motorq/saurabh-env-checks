const enviroment = {
	"name": "CUSTOMER_DEMO",
	"apiVersion": "v3",
	"feedApiUrl": process.env.CUSTOMER_DEMO_FEED_API_URL,
	"fmcaUrl": process.env.CUSTOMER_DEMO_FMCA_URL,
	"clientId": process.env.CUSTOMER_DEMO_CLIENT_ID,
	"clientSecret": process.env.CUSTOMER_DEMO_CLIENT_SECRET,
	"audience": process.env.CUSTOMER_DEMO_AUDIENCE,
	"apiEndpointsToMonitor": {
		"enrollments": false,
		"telemetry-feed": true,
		"event-feed": true,
		"trip-feed": true,
		"latest": true,
		"vehicles": true,
		"devices": true,
		"open-events": true,
	},
	"shouldMonitorFmcaEndpoints": true,
	"endpointIdleTimeoutInMins": "",
	"infra": {
		"ai": {
			"id": process.env.MOTORQ_CUSTOMER_DEMO_APP_ID,
			"key": process.env.MOTORQ_CUSTOMER_DEMO_APP_KEY
		},
		"eh": {
			"event_hub_namespace": process.env.CUSTOMER_DEMO_EVENT_HUB_NAMESPACE,
			"geotab_event_hub_namespace": process.env.CUSTOMER_DEMO_GEOTAB_EVENT_HUB_NAMESPACE,
			"geotab_event_hub": "geotaborderedmessages",
			"geotab_event_hub_partition_count": "2",
			"geotab_unbuffered_event_hub": "geotaborderedmessagesunbuffered",
			"geotab_unbuffered_event_hub_partition_count": "2",
			"gm_source_xml_event_hub_namespace": process.env.CUSTOMER_DEMO_GM_SOURCE_XML_EVENT_HUB_NAMESPACE,
			"gm_source_xml_event_hub": "gmsourcexml-prod",
			"gm_event_hub_namespace": process.env.CUSTOMER_DEMO_GM_EVENT_HUB_NAMESPACE,
			"gm_event_hub": "gmorderedmessages",
			"gm_event_hub_partition_count": "2",
			"gm_unbuffered_event_hub_partition_count": "2",
			"gm_unbuffered_event_hub": "gmunbufferedmessages",
			"calamp_event_hub_namespace": process.env.CUSTOMER_DEMO_CALAMP_EVENT_HUB_NAMESPACE,
			"calamp_event_hub": "calamporderedmessages",
			"calamp_event_hub_partition_count": "1",
			"calamp_unbuffered_event_hub": "calamporderedmessages",
			"calamp_unbuffered_event_hub_partition_count": "2",
			"toyota_event_hub_namespace": process.env.CUSTOMER_DEMO_TOYOTA_EVENT_HUB_NAMESPACE,
			"toyota_event_hub": "toyotaorderedmessages",
			"toyota_event_hub_partition_count": "2",
			"toyota_unbuffered_event_hub": "toyotaorderedmessagesunbuffered",
			"toyota_unbuffered_event_hub_partition_count": "2",
			"ford_event_hub_namespace": process.env.CUSTOMER_DEMO_FORD_EVENT_HUB_NAMESPACE,
			"ford_event_hub": "fordorderedmessages",
			"ford_event_hub_partition_count": "2",
			"ford_unbuffered_event_hub": "fordorderedmessages",
			"ford_unbuffered_event_hub_partition_count": "2",
			"fleet_complete_event_hub_namespace": process.env.CUSTOMER_DEMO_FLEET_COMPLETE_EVENT_HUB_NAMESPACE,
			"fleet_complete_event_hub": "fleetcompletemessages",
			"fleet_complete_event_hub_partition_count": "2",
			"fleet_complete_unbuffered_event_hub": "fleetcompletemessages",
			"fleet_complete_unbuffered_event_hub_partition_count": "2",
			"email_eventhub_namespace": process.env.CUSTOMER_DEMO_EMAIL_EVENTHUB_NAMESPACE,
			"enrollment_eventhub_namespace": process.env.CUSTOMER_DEMO_ENROLLMENT_EVENTHUB_NAMESPACE,
			"telematics_postprocessor_eventhub_namespace": process.env.CUSTOMER_DEMO_TELEMATICS_POSTPROCESSOR_EVENTHUB_NAMESPACE,
			"telematics_postprocessor_eventhub": "feedmessages",
			"telematics_postprocessor_event_hub_partition_count": "1"
		},
		"cosmos": {
			"key": process.env.CUSTOMER_DEMO_COSMOS_KEY,
			"endpoint": "https://motorqcustomerdemo-cosmos.documents.azure.com:443/"
		},
		"pager": {
			"criticalKey": process.env.PAGER_MOTORQ_CUSTOMER_DEMO_CRITICAL_KEY
		},
		"pg": {},

		"storage": {},
		"auth0": {}
	},
	"components": {
		"geotab": {
			"core-geotab-processor": {
				"instanceCount": 1
			},
			"core-geotab-latest-processor": {
				"instanceCount": 1
			},
			"geotab-poller": {
				"instanceCount": 1
			},
			"geotab-poller-unbuffered": {
				"instanceCount": 1
			}
		},
		"calamp": {
			"core-calamp-processor": {
				"instanceCount": 1
			},
			"core-calamp-latest-processor": {
				"instanceCount": 1
			}
		},
		"gm": {
			"core-gm-message-bufferer": {
				"instanceCount": 2
			},
			"core-gm-message-unbuffered": {
				"instanceCount": 2
			},
			"core-gm-xml-processor": {
				"instanceCount": 2
			},
			"core-gm-processor": {
				"instanceCount": 2
			},
			"core-gm-latest-processor": {
				"instanceCount": 2
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
		},
		"common": {
			"telematics-postprocessor": {
				"instanceCount": 1
			},
			"cosmosdb-eventhub-sync": {},
			"cosmosdb-feedeventhub-sync-v3": {},
			"weatherbit-poller": {
				"instanceCount": 1
			},
			"fmca-api": {}
		}
	},
	"disabledHeartbeats": [
		"Trips fetch heartbeat",
		"Trips push heartbeat",
		"lat/lon sync heartbeat"
	]
}
module.exports = enviroment