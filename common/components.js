const components = {
    geotab: {
        'geotab-poller': { source: "GEOTAB", heartbeats: [{ searchKey: 'geotab-poller-__id heartbeat' }] },
        'geotab-poller-unbuffered': { source: "GEOTAB", heartbeats: [{ searchKey: 'geotab-poller-unbuffered-__id heartbeat' }] },
        'core-geotab-processor': { source: "GEOTAB", heartbeats: [{ searchKey: 'core-geotab-processor-__id heartbeat' }], eh: { ns: 'geotab_event_hub_namespace', name: 'geotab_event_hub', defaultName: "geotaborderedmessages", checkpoint: "GEOTAB|OFFSET|__id" } },
        'core-geotab-latest-processor': { source: "GEOTAB", heartbeats: [{ searchKey: 'core-geotab-latest-processor-__id heartbeat' }], eh: { ns: 'geotab_event_hub_namespace', name: 'geotab_unbuffered_event_hub', defaultName: "geotaborderedmessagesunbuffered", checkpoint: "GEOTAB|LATEST|OFFSET|__id" } }
    },
    fleetComplete: {
        'fleetcomplete-poller': { source: "FLEETCOMPLETE", heartbeats: [{ searchKey: 'fleetcomplete-poller-__id|Asset fetch heartbeat' }, { searchKey: 'fleetcomplete-poller-__id|Asset push heartbeat' }] },
        'fleetcomplete-entity-mapping-updater': { source: "FLEETCOMPLETE", heartbeats: [{ searchKey: 'fleetcomplete-entity-mapping-updater heartbeat', timespan: '1440m' }] },
        'core-fleetcomplete-processor': { source: "FLEETCOMPLETE", heartbeats: [{ searchKey: 'core-fleetcomplete-processor-__id heartbeat' }] }, eh: { ns: 'fleet_complete_event_hub_namespace', name: 'fleet_complete_event_hub', defaultName: "fleetcompletemessages", checkpoint: "FLEETCOMPLETE|OFFSET|__id" },
        'core-fleetcomplete-latest-processor': { source: "FLEETCOMPLETE", heartbeats: [{ searchKey: 'core-fleetcomplete-latest-processor-__id heartbeat' }], eh: { ns: 'fleet_complete_event_hub_namespace', name: 'fleet_complete_unbuffered_event_hub', defaultName: "fleetcompletemessages", checkpoint: "FLEETCOMPLETE|LATEST|OFFSET|__id" } }
    },
    calamp: {
        'calamp-poller': { source: "CALAMP", heartbeats: [{ searchKey: 'calamp-poller-__id heartbeat' }] },
        'core-calamp-processor': { source: "CALAMP", heartbeats: [{ searchKey: 'core-calamp-processor-__id heartbeat' }], eh: { ns: 'calamp_event_hub_namespace', name: 'calamp_event_hub', defaultName: "calamporderedmessages", checkpoint: "CALAMP|OFFSET|__id" } },
        'core-calamp-latest-processor': { source: "CALAMP", heartbeats: [{ searchKey: 'core-calamp-latest-processor-__id heartbeat' }], eh: { ns: 'calamp_event_hub_namespace', name: 'calamp_unbuffered_event_hub', defaultName: "calamporderedmessagesunbuffered", checkpoint: "CALAMP|LATEST|OFFSET|__id" } }
    },
    gm: {
        'core-gm-xml-processor': { source: "GM", heartbeats: [{ searchKey: 'core-gm-xml-processor-__id heartbeat' }], eh: { ns: 'gm_source_xml_event_hub_namespace', name: 'gm_source_xml_event_hub', defaultName: "gmsourcexml", checkpoint: "GMSOURCEXMLEVENTHUB|OFFSET|__id" } },
        'core-gm-message-bufferer': { source: "GM", heartbeats: [{ searchKey: 'core-gm-message-bufferer-__id heartbeat' }], eh: { ns: 'gm_event_hub_namespace', name: 'gm_parsed_source_messages_event_hub', defaultName: "gmparsedmessages", checkpoint: "EVENTHUB-__ehname__-__id" } },
        'core-gm-message-unbuffered': { source: "GM", heartbeats: [{ searchKey: 'core-gm-message-unbuffered-__id heartbeat' }], eh: { ns: 'gm_event_hub_namespace', name: 'gm_parsed_source_messages_event_hub', defaultName: "gmparsedmessages", checkpoint: "EVENTHUB-__ehname__-unbuffered-__id" } },
        'core-gm-processor': { source: "GM", heartbeats: [{ searchKey: 'core-gm-processor-__id heartbeat' }], eh: { ns: 'gm_event_hub_namespace', name: 'gm_event_hub', defaultName: "gmorderedmessages", checkpoint: "GM|OFFSET|__id" } },
        'core-gm-latest-processor': { source: "GM", heartbeats: [{ searchKey: 'core-gm-latest-processor-__id heartbeat' }], eh: { ns: 'gm_event_hub_namespace', name: 'gm_unbuffered_event_hub', defaultName: "gmunbufferedmessages", checkpoint: "GM|LATEST|OFFSET|__id" } },
        'gm-push-consumer': { source: "GM", heartbeats: [] }
    },
    ford: {
        'ford-poller': { source: "FORD", heartbeats: [{ searchKey: 'ford-poller-__id heartbeat', timespan: '5m' }] },
        'ford-unbuffered-poller': { source: "FORD", heartbeats: [{ searchKey: 'ford-unbuffered-poller-__id heartbeat' }] },
        'core-ford-processor': { source: "FORD", heartbeats: [{ searchKey: 'core-ford-processor-__id heartbeat' }], eh: { ns: 'ford_event_hub_namespace', name: 'ford_event_hub', defaultName: "ford", checkpoint: "FORD|OFFSET|__id" } },
        'core-ford-latest-processor': { source: "FORD", heartbeats: [{ searchKey: 'core-ford-latest-processor-__id heartbeat', timespan: '15m' }], eh: { ns: 'ford_event_hub_namespace', name: 'ford_unbuffered_event_hub', defaultName: "fordunbuffered", checkpoint: "FORD|LATEST|OFFSET|__id" } }
    },
    toyota: {
        'toyota-poller': { source: "TOYOTA", heartbeats: [{ searchKey: 'toyota-poller-__id|Telemetry fetch heartbeat' }, { searchKey: 'toyota-poller-__id|Telemetry push heartbeat', timespan: '120m' }, { searchKey: 'toyota-poller-__id|Trips fetch heartbeat' }, { searchKey: 'toyota-poller-__id|Trips push heartbeat', timespan: '120m' }] },
        'toyota-trip-poller': { source: "TOYOTA", heartbeats: [{ searchKey: 'toyota-trip-poller-__id|Trips fetch heartbeat' }, { searchKey: 'toyota-trip-poller-__id|Trips push heartbeat' }] },
        'toyota-trip-sftp-poller': { source: "TOYOTA", heartbeats: [{ searchKey: 'toyota-trip-sftp-poller-__id heartbeat', timespan: '90m' }] },
        'toyota-filterer-bufferer': { source: "TOYOTA", heartbeats: [{ searchKey: 'toyota-filterer-bufferer-__id pull heartbeat' }, { searchKey: 'toyota-filterer-bufferer-__id push heartbeat' }] },
        'toyota-filterer-unbuffered': { source: "TOYOTA", heartbeats: [{ searchKey: 'toyota-filterer-unbuffered-__id pull heartbeat' }, { searchKey: 'toyota-filterer-unbuffered-__id push heartbeat' }] },
        'core-toyota-processor': { source: "TOYOTA", heartbeats: [{ searchKey: 'core-toyota-processor-__id heartbeat' }], eh: { ns: 'toyota_event_hub_namespace', name: 'toyota_event_hub', defaultName: "toyotaorderedmessages", checkpoint: "TOYOTA|OFFSET|__id" } },
        'core-toyota-latest-processor': { source: "TOYOTA", heartbeats: [{ searchKey: 'core-toyota-latest-processor-__id heartbeat' }], eh: { ns: 'toyota_event_hub_namespace', name: 'toyota_unbuffered_event_hub', defaultName: "toyotaorderedmessagesunbuffered", checkpoint: "TOYOTA|LATEST|OFFSET|__id" } },
        'toyota-latest-stream-poller': { source: "TOYOTA", heartbeats: [{ searchKey: 'toyota-latest-stream-poller-__id push heartbeat', timespan: '5m' }, { searchKey: 'toyota-latest-stream-poller-__id receive heartbeat' }] },
        'toyota-offset-stream-poller': { source: "TOYOTA", heartbeats: [{ searchKey: 'toyota-offset-stream-poller-__id heartbeat', timespan: '10m' }] },
        'toyota-stream-merger': { source: "TOYOTA", heartbeats: [{ searchKey: 'toyota-stream-merger-__id push heartbeat', timespan: "10m" }, { searchKey: 'toyota-stream-merger-__id pull heartbeat' }] },
        'toyota-latest-offset-unbuffered': { source: "TOYOTA", heartbeats: [{ searchKey: 'toyota-latest-offset-unbuffered-__id latest heartbeat', timespan: "10m" }, { searchKey: 'toyota-latest-offset-unbuffered-__id offset heartbeat', timespan: "10m" }] },
        'toyota-consent-processor': { source: "TOYOTA", heartbeats: [], eh: { ns: 'toyota_consent_event_hub_namespace', name: "toyota_consent_event_hub_name", defaultName: 'toyota-consent', checkpoint: "EVENTHUB-__ehname__-__id-consent" } },
        'toyota-collision-subscription': { source: "TOYOTA", heartbeats: [] }
    },
    vw: {
        'vw-sampler-partitioner': { source: "VOLKSWAGEN", heartbeats: [{ searchKey: 'vw-sampler-partitioner-__id pull heartbeat' }, { searchKey: 'vw-sampler-partitioner-__id push heartbeat' }], eh: { ns: 'volkswagen_source_event_hub_namespace', name: 'volkswagen_source_event_hub', defaultName: "telematics", checkpoint: "EVENTHUB-__ehname__-__id" } },
        'vw-sampler-partitioner-unbuffered': { source: "VOLKSWAGEN", heartbeats: [{ searchKey: 'vw-sampler-partitioner-unbuffered-__id pull heartbeat' }, { searchKey: 'vw-sampler-partitioner-unbuffered-__id push heartbeat' }], eh: { ns: 'volkswagen_source_event_hub_namespace', name: 'volkswagen_source_event_hub', defaultName: "telematics", checkpoint: "EVENTHUB-__ehname__-unbuffered-__id" } },
        'vw-bufferer': { source: "VOLKSWAGEN", heartbeats: [{ searchKey: 'vw-bufferer-__id pull heartbeat' }, { searchKey: 'vw-bufferer-__id push heartbeat' }] },
        'core-volkswagen-processor': { source: "VOLKSWAGEN", heartbeats: [{ searchKey: 'core-volkswagen-processor-__id heartbeat' }], eh: { ns: 'volkswagen_event_hub_namespace', name: 'volkswagen_event_hub_buffered', defaultName: "vwmessagesbuffered", checkpoint: "VOLKSWAGEN|OFFSET|__id" } },
        'core-volkswagen-latest-processor': { source: "VOLKSWAGEN", heartbeats: [{ searchKey: 'core-volkswagen-latest-processor-__id heartbeat' }], eh: { ns: 'volkswagen_event_hub_namespace', name: 'volkswagen_event_hub_unbuffered', defaultName: "vwmessagesunbuffered", checkpoint: "VOLKSWAGEN|LATEST|OFFSET|__id" } }
    },
    daimler: {
        'daimlerpro-poller': { source: "DAIMLERPRO", heartbeats: [{ searchKey: 'daimlerpro-poller-__id latest fetch heartbeat' }, { searchKey: 'daimlerpro-poller-__id latest push heartbeat' }, { searchKey: 'daimlerpro-poller-__id historic fetch heartbeat' }, { searchKey: 'daimlerpro-poller-__id historic push heartbeat' }] },
        'daimlerpro-latest-poller': { source: "DAIMLERPRO", heartbeats: [{ searchKey: 'daimlerpro-latest-poller-__id latest fetch heartbeat' }, { searchKey: 'daimlerpro-latest-poller-__id latest push heartbeat' }] },
        'daimlerpro-merger': { source: "DAIMLERPRO", heartbeats: [{ searchKey: 'daimlerpro-merger-__id Latest fetch heartbeat' }, { searchKey: 'daimlerpro-merger-__id historic fetch heartbeat' }, { searchKey: 'daimlerpro-merger-__id buffer heartbeat' }, { searchKey: 'daimlerpro-merger-__id push heartbeat' }] },
        'daimlerpro-bufferer': { source: "DAIMLERPRO", heartbeats: [{ searchKey: 'daimlerpro-bufferer-__id pull heartbeat' }, { searchKey: 'daimlerpro-bufferer-__id push heartbeat' }] },
        'daimlerpro-unbuffered': { source: "DAIMLERPRO", heartbeats: [{ searchKey: 'daimlerpro-unbuffered-__id pull heartbeat' }, { searchKey: 'daimlerpro-unbuffered-__id push heartbeat' }] },
        'core-daimlerpro-processor': { source: "DAIMLERPRO", heartbeats: [{ searchKey: 'core-daimlerpro-processor-__id heartbeat' }], eh: { ns: 'daimlerpro_event_hub_namespace', name: 'daimlerpro_event_hub', defaultName: "daimlerproordereddata", checkpoint: "DAIMLERPRO|OFFSET|__id" } },
        'core-daimlerpro-latest-processor': { source: "DAIMLERPRO", heartbeats: [{ searchKey: 'core-daimlerpro-latest-processor-__id heartbeat', timespan: '15m' }], eh: { ns: 'daimlerpro_event_hub_namespace', name: 'daimlerpro_unbuffered_event_hub', defaultName: "daimlerprounbuffereddata", checkpoint: "DAIMLERPRO|LATEST|OFFSET|__id" } }
    },
    common: {
        'reference-data-archival-job': { heartbeats: [{ searchKey: 'reference-data-archival-job heartbeat' }] },
        'enrollment-logging': { heartbeats: [{ searchKey: 'enrollment-logger heartbeat', timespan: '120m' }] },
        'enrollment-processor': { heartbeats: [{ searchKey: 'enrollment-processor-__id heartbeat' }, { searchKey: 'pending-enrollment-processor-__id heartbeat' }], eh: { ns: 'enrollment_eventhub_namespace', name: 'enrollment_eventhub_name', defaultName: "enrollments", checkpoint: "EVENTHUB-__ehname__-__id" } },
        'enollment-history-sync': {},
        'core-cron-jobs': {},
        'telematics-archival-job': { heartbeats: [{ searchKey: 'telematics-archival-job heartbeat' }] },
        'telematics-postprocessor': { heartbeats: [{ searchKey: 'telematics-postprocessor-__id heartbeat' }], eh: { defaultName: "feedmessages", checkpoint: "TELEMATICS|OFFSET|__id" }, eh: { ns: 'telematics_postprocessor_eventhub_namespace', name: 'telematics_postprocessor_eventhub', defaultName: null, checkpoint: "TELEMATICS|OFFSET|__id" } },
        'cosmosdb-eventhub-sync': { heartbeats: [{ searchKey: 'cosmosdb-eventhub-sync-__id heartbeat' }] },
        'cosmosdb-eventhub-sync-v3': { heartbeats: [{ searchKey: 'cosmosdb-eventhub-sync-v3 heartbeat' }] },
        'cosmosdb-feed-eventhub-sync': { heartbeats: [{ searchKey: 'cosmosdb-feed-eventhub-sync-__id heartbeat' }] },
        'cosmosdb-feedeventhub-sync': { heartbeats: [{ searchKey: 'cosmosdb-feedeventhub-sync heartbeat' }] },
        'cosmosdb-feedeventhub-sync-v3': { heartbeats: [{ searchKey: 'cosmosdb-feedeventhub-sync-v3 heartbeat' }] },
        'cosmosdb-feedeventhub-sync-v3-id': { heartbeats: [{ searchKey: 'cosmosdb-feedeventhub-sync-v3-__id heartbeat' }] },
        'cosmosdb-feedeventhub-sync-v3multi': { heartbeats: [{ searchKey: 'cosmosdb-feedeventhub-sync-v3multi heartbeat' }] },
        'weatherbit-poller': { heartbeats: [{ searchKey: 'weatherbit-poller-__id heartbeat', timespan: "600m" }] },
        'emailer': { heartbeats: [{ searchKey: 'emailer-__id heartbeat' }], eh: { ns: 'email_eventhub_namespace', name: 'email_eventhub_name', defaultName: "emails", checkpoint: "EVENTHUB-__ehname__-__id-emailer" } },
        'fmca-api': {
            heartbeats: [
                { searchKey: 'device sync heartbeat', timespan: "45m" },
                { searchKey: 'vehicle sync heartbeat', timespan: "45m" },
                { searchKey: 'trip feed sync heartbeat', timespan: "45m" },
                { searchKey: 'event feed sync heartbeat', timespan: "45m" },
                { searchKey: 'lat/lon sync heartbeat', timespan: "45m" },
                { searchKey: 'lat lon sync heartbeat', timespan: "45m" }
            ]
        },
        'gm-sourcetable-to-eventhub': { heartbeats: [{ searchKey: 'gm-sourcetable-to-eventhub heartbeat' }] },
        'fuel-transaction-processor': { heartbeats: [{ searchKey: 'fuel-exception-event-processor heartbeat', timespan: "180m" }, { searchKey: 'fuel-transaction-file-processor heartbeat' }] },
        'geotab-odo-batch': { heartbeats: [{ searchKey: 'Geotab odo batch cron job heartbeat', timespan: "1470m" }] }, // 1440m+30m (will be notified in 30 minutes after hb fail)
        'geotab-odo-batch-account': { heartbeats: [{ searchKey: 'Geotab api call __id heartbeat', timespan: "1470m" }] }
    },
    predelivery: {
        'core-gm-predelivery-tracker': { heartbeats: [{ searchKey: 'core-gm-predelivery-tracker-__id heartbeat' }] },
        'core-gm-predelivery-processor': { heartbeats: [{ searchKey: 'core-gm-predelivery-processor-__id heartbeat' }] }
    }
}
module.exports = { components }
