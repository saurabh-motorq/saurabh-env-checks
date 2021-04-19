const { PgDb } = require('./pg-db');
const pgDb = new PgDb();
const moment = require('moment');

async function insertAlertIntoPg(environment, alertType, anomalies) {
    await pgDb.query(`INSERT INTO MONITORING_ANOMALIES(ENVIRONMENT_NAME, TYPE, TIMESTAMP, ANOMALY) VALUES($1, $2, $3, $4)`, [environment, alertType, moment().toISOString(), anomalies])
}

module.exports = {insertAlertIntoPg};