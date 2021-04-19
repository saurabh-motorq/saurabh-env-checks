require('dotenv').config();
let config = {};

config.sendgridKey = process.env.SENDGRID_KEY;
module.exports = config;