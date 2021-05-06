const { PgDb } = require('./pg-db');
const pgDb = new PgDb();
const moment = require('moment');

async function insertAlertIntoPg(environment, alertType, alertSubtype, anomalies) {
    await pgDb.query(`INSERT INTO MONITORING_ANOMALIES(ENVIRONMENT_NAME, TYPE, SUBTYPE, TS, ANOMALY) VALUES($1, $2, $3, $4, $5)`, [environment, alertType, alertSubtype, moment().toISOString(), anomalies])
}

module.exports = {insertAlertIntoPg};