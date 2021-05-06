const { PgDb } = require('./pg-db');
const config = require('./config');
const pgDb = new PgDb(config);
const moment = require('moment');

async function insertAlertIntoPg(environment, alertType, alertSubtype, anomalies) {
    await pgDb.query(`INSERT INTO monitoring_anomalies(ENVIRONMENT_NAME, TYPE, SUBTYPE,TS, ANOMALY) VALUES($1, $2, $3, $4)`, [environment, alertType, alertSubtype, moment().toISOString(), anomalies]);
}

async function queryAll(){
    return await pgDb.query(`select * from monitoring_anomalies where monitoring_anomalies.ts > now() - Interval '1 HOUR + 1 DAY'`);
}
module.exports = { insertAlertIntoPg, queryAll };