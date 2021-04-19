
const config = require('./config');
let rp = require('request-promise');

async function sendMail(subject, mailBody) {
    let options = {
        method: 'POST',
        uri: config.mailerUrl,
        body: {
            "from": config.mailFrom,
            "to": config.mailTo,
            "subject": subject,
            "html": mailBody
        },
        json: true
    };
    await rp(options);
}

module.exports = { sendMail }