const environment = {
	"name": "SAURABH_TEST",
	"apiVersion": "v3",
	// "feedApiUrl": process.env.CUSTOMER_DEMO_FEED_API_URL,
	// "fmcaUrl": process.env.CUSTOMER_DEMO_FMCA_URL,
	// "clientId": process.env.CUSTOMER_DEMO_CLIENT_ID,
	// "clientSecret": process.env.CUSTOMER_DEMO_CLIENT_SECRET,
	// "audience": process.env.CUSTOMER_DEMO_AUDIENCE,
	// "apiEndpointsToMonitor": {
	// 	"enrollments": false,
	// 	"telemetry-feed": true,
	// 	"event-feed": true,
	// 	"trip-feed": true,
	// 	"latest": true,
	// 	"vehicles": true,
	// 	"devices": true,
	// 	"open-events": true,
	// },
	// "shouldMonitorFmcaEndpoints": true,
	// "endpointIdleTimeoutInMins": "",
	"infra": {
		"ai": {
			"id": process.env.MOTORQ_SAURABH_TEST_APP_ID,
			"key": process.env.MOTORQ_SAURABH_TEST_APP_KEY
		},
		"eh": {
			// "event_hub_namespace": process.env.CUSTOMER_DEMO_EVENT_HUB_NAMESPACE,
			"geotab_event_hub":{
				"name": process.env.SAURABH_TEST_GEOTAB_EVENT_HUB,
				"namespace": process.env.SAURABH_TEST_EVENT_HUB_NAMESPACE,
				"partition_count": "2",
				"namespace_uri": process.env.SAURABH_TEST_EVENT_HUB_NAMESPACE_URI,
				"connection_string": process.env.SAURABH_TEST_EVENT_HUB_CONNECTION_STRING,
				"isSource": 1,
				"isCustomer": 0
			},
			"feed_event_hub": {
				"name": process.env.SAURABH_TEST_FEED_EVENT_HUB,
				"namespace": process.env.SAURABH_TEST_EVENT_HUB_NAMESPACE,
				"partition_count": "2",
				"namespace_uri": process.env.SAURABH_TEST_EVENT_HUB_NAMESPACE_URI,
				"connection_string": process.env.SAURABH_TEST_EVENT_HUB_CONNECTION_STRING,
				"isSource": 0,
				"isCustomer": 1
			},
			"clientId": process.env.SAURABH_TEST_EVENT_HUB_CLIENT_ID,
			"clientSecret": process.env.SAURABH_TEST_EVENT_HUB_CLIENT_SECRET,
			"tenantId": process.env.SAURABH_TEST_EVENT_HUB_TENANT_ID,
			// "geotab_unbuffered_event_hub": "geotaborderedmessagesunbuffered",
			// "geotab_unbuffered_event_hub_partition_count": "2",
			// "gm_source_xml_event_hub_namespace": process.env.CUSTOMER_DEMO_GM_SOURCE_XML_EVENT_HUB_NAMESPACE,
			// "gm_source_xml_event_hub": "gmsourcexml-prod",
			// "gm_event_hub_namespace": process.env.CUSTOMER_DEMO_GM_EVENT_HUB_NAMESPACE,
			// "gm_event_hub": "gmorderedmessages",
			// "gm_event_hub_partition_count": "2",
			// "gm_unbuffered_event_hub_partition_count": "2",
			// "gm_unbuffered_event_hub": "gmunbufferedmessages",
			// "calamp_event_hub_namespace": process.env.CUSTOMER_DEMO_CALAMP_EVENT_HUB_NAMESPACE,
			// "calamp_event_hub": "calamporderedmessages",
			// "calamp_event_hub_partition_count": "1",
			// "calamp_unbuffered_event_hub": "calamporderedmessages",
			// "calamp_unbuffered_event_hub_partition_count": "2",
			// "toyota_event_hub_namespace": process.env.CUSTOMER_DEMO_TOYOTA_EVENT_HUB_NAMESPACE,
			// "toyota_event_hub": "toyotaorderedmessages",
			// "toyota_event_hub_partition_count": "2",
			// "toyota_unbuffered_event_hub": "toyotaorderedmessagesunbuffered",
			// "toyota_unbuffered_event_hub_partition_count": "2",
			// "ford_event_hub_namespace": process.env.CUSTOMER_DEMO_FORD_EVENT_HUB_NAMESPACE,
			// "ford_event_hub": "fordorderedmessages",
			// "ford_event_hub_partition_count": "2",
			// "ford_unbuffered_event_hub": "fordorderedmessages",
			// "ford_unbuffered_event_hub_partition_count": "2",
			// "fleet_complete_event_hub_namespace": process.env.CUSTOMER_DEMO_FLEET_COMPLETE_EVENT_HUB_NAMESPACE,
			// "fleet_complete_event_hub": "fleetcompletemessages",
			// "fleet_complete_event_hub_partition_count": "2",
			// "fleet_complete_unbuffered_event_hub": "fleetcompletemessages",
			// "fleet_complete_unbuffered_event_hub_partition_count": "2",
			// "email_eventhub_namespace": process.env.CUSTOMER_DEMO_EMAIL_EVENTHUB_NAMESPACE,
			// "enrollment_eventhub_namespace": process.env.CUSTOMER_DEMO_ENROLLMENT_EVENTHUB_NAMESPACE,
			// "telematics_postprocessor_eventhub_namespace": process.env.CUSTOMER_DEMO_TELEMATICS_POSTPROCESSOR_EVENTHUB_NAMESPACE,
			// "telematics_postprocessor_eventhub": "feedmessages",
			// "telematics_postprocessor_event_hub_partition_count": "1"
		},
		"cosmos": {
			"key": process.env.DOCDB_ACCESS_KEY_READ_ACCESS,
			"endpoint": process.env.DOCDB_ENDPOINT,
			"database": {
				'id': process.env.DOCDB_NAME || 'core-fleet'
			},
			"collection": {
				'entitiesId': process.env.DOCDB_ENTITIES_COLLECTION || 'entities',
				'telematicsId': process.env.DOCDB_TELEMATICS_COLLECTION || 'telematics',
				'referenceDataId': process.env.DOCDB_REFERENCE_DATA_COLLECTION || 'reference-data'
			},
		},
		"pager": {
			"criticalKey": process.env.PAGER_MOTORQ_SAURABH_TEST_CRITICAL_KEY
		},
		"pg": {
            "host": process.env.PG_SAURABH_TEST_HOST,
            "port": process.env.PG_SAURABH_TEST_PORT,
            "user": process.env.PG_SAURABH_TEST_USER,
            "password": process.env.PG_SAURABH_TEST_USER_PASSWORD,
            "sslmode":  process.env.PG_SAURABH_TEST_SSLMODE,
            "dbname": process.env.PG_SAURABH_TEST_DBNAME,
			"tables": {
				'tripFeed': process.env.PGDB_TRIP_FEED_TABLE || 'tripfeed',
				'eventFeed': process.env.PGDB_EVENT_FEED_TABLE || 'eventfeed',
				'latestStore': process.env.PGDB_LATEST_STORE_TABLE || 'latest_store',
				'vehicles': process.env.PGDB_VEHICLES_TABLE || 'vehicles',
				'devices': process.env.PGDB_DEVICES_TABLE || 'devices'
			}
        },

		"storage": {},
		"auth0": {}
	},
	"components": {
		"geotab": {
			"core-geotab-processor": {
				"instanceCount": 1
			},
			"core-geotab-latest-processor": {
				"instanceCount": 2
			},
			"geotab-poller": {
				"instanceCount": 1
			},
			// "geotab-poller-unbuffered": {
			// 	"instanceCount": 1
			// }
		},
		// "calamp": {
		// 	"core-calamp-processor": {
		// 		"instanceCount": 1
		// 	},
		// 	"core-calamp-latest-processor": {
		// 		"instanceCount": 1
		// 	}
		// },
		// "gm": {
		// 	"core-gm-message-bufferer": {
		// 		"instanceCount": 2
		// 	},
		// 	"core-gm-message-unbuffered": {
		// 		"instanceCount": 2
		// 	},
		// 	"core-gm-xml-processor": {
		// 		"instanceCount": 2
		// 	},
		// 	"core-gm-processor": {
		// 		"instanceCount": 2
		// 	},
		// 	"core-gm-latest-processor": {
		// 		"instanceCount": 2
		// 	}
		// },
		// "toyota": {
		// 	"core-toyota-latest-processor": {
		// 		"instanceCount": 2
		// 	},
		// 	"core-toyota-processor": {
		// 		"instanceCount": 2
		// 	},
		// 	"toyota-filterer-unbuffered": {
		// 		"instanceCount": 2
		// 	},
		// 	"toyota-filterer-bufferer": {
		// 		"instanceCount": 2
		// 	}
		// },
		"common": {
			// "telematics-postprocessor": {
			// 	"instanceCount": 1
			// },
			"cosmosdb-eventhub-sync": {},
			// "cosmosdb-feedeventhub-sync-v3": {},
			// "weatherbit-poller": {
			// 	"instanceCount": 1
			// },
			// "fmca-api": {}
		}
	},
	"disabledHeartbeats": [
		"Trips fetch heartbeat",
		"Trips push heartbeat",
		"lat/lon sync heartbeat"
	]
}
module.exports = environment