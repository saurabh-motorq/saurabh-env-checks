const snowflake = require('snowflake-sdk');
const utility = require('./utility');
const moment  = require('moment');
let rp = require('request-promise');
const config = require('./config');
const { environments } = require('../common/environments/index');
require('dotenv').config()
const syncCheckRepo = require('./sync-check-repo');
const volumeCheckRepo = require('./volume-check-repo');
const duplicateCheckRepo = require('./duplicate-check-repo');
const feedVersionCheckRepo = require('./feed-version-check-repo');

let connection = null;

async function setupSnowflakeClient(context) {
    connection = snowflake.createConnection({
        account: config.account,
        username: config.username,
        password: config.password,
        database: 'MOTORQ',
        schema: 'MOTORQ_STAGE',
        warehouse: 'MOTORQ_UTEST',
        role: 'SYSADMIN'
    });


    await connection.connect(function (err, conn) {
        if (err) {
            context.error('Unable to connect: ' + err.message);
            throw err;
        } else {
            context.log('Successfully connected as id: ' + connection.getId());
        }
    });
}

module.exports = async function (context, myTimer) {
    context = console;
    await setupSnowflakeClient(context);   
    await syncCheckRepo.performSyncChecks(connection, context); 
    await volumeCheckRepo.performVolumeChecks(connection, context);
    await duplicateCheckRepo.performDuplicateChecks(connection, context);
    await feedVersionCheckRepo.performFeedVersionChecks(connection, context);
}
