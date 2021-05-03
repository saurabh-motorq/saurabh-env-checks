const { PgDb } = require('./pg-db');
const config = require('./config');
const pgDb = new PgDb(config);
const moment = require('moment');

async function insertAlertIntoPg(environment, alertType, anomalies) {
    await pgDb.query(`INSERT INTO anomalies(ENVIRONMENT_NAME, TYPE, TS, ANOMALY) VALUES($1, $2, $3, $4)`, [environment, alertType, moment().toISOString(), anomalies]);
}

async function queryAll(){
    return await pgDb.query(`select * from anomalies where anomalies.ts > now() - Interval '1 HOUR + 1 DAY'`);
}
module.exports = { insertAlertIntoPg, queryAll };