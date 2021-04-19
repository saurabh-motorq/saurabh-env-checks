function getLatestSyncQuery() {
    return `
		select
        'local' as CUSTOMER_NAME,'DEMO' as ENV_TYPE,'V3' as SCHEMA_TYPE,
        (select top 1 timestamp from events order by timestamp desc) as lastsync_events_ts,
        (select top 1 timestamp from telemetry order by timestamp desc) as lastsync_telemetry_ts,
        (select top 1 end_TIMESTAMP from trips order by end_TIMESTAMP desc) as lastsync_trips_ts
        `
}

module.exports = {
    getLatestSyncQuery
}