require('dotenv').config();
let config = {};

config.appId = "";
config.key = "";

config.context;

config.mailerUrl=process.env.MAILER_URL
config.mailFrom = 'automatedtest@Motorq.co',
config.mailTo = 'servicealerts@motorq.co',
config.mailSubject = 'Customer Request Monitoring',
config.mailText = '',

module.exports = config;