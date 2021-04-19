require('dotenv').config();
const { SourceType, Environment } = require('./enum');

const config = {};

//config.environments = [Environment.Local]
config.environments = [];
config.mailerUrl = process.env.MAILER_URL || 'https://motorq-environment-monitoring.azurewebsites.net/api/mail-helper?code=BR9mE5eVCC5ln8ZFibE8JL5oCNQDNDoiZzmdHahKJAd76IJzBMc6wA==';
config.mailFrom = 'automatedtest@Motorq.co';
config.mailTo = 'servicealerts@motorq.co';
//config.mailTo='arshad@motorq.co';
config.geotabResultsLimit = process.env.GEOTAB_RESULTS_LIMIT || 1000;

config.geotabApiTimeout = parseInt(process.env.GEOTAB_API_TIMEOUT) || 30000;
config.geotabPollerToVersionGapThreshold = 10000;
config.geotabServer = 'my.geotab.com';

config[Environment.Local] = localConfigs;


module.exports = config;