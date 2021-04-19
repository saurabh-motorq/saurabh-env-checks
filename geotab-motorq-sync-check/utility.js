const config = require('./config');

module.exports = {
    mail: function({
        fileName,
        fileType,
        fileContents,
        body,
        htmlBody,
        mailSubject
    }) {
        const rp = require('request-promise');
        let options = {
            method: 'POST',
            uri: config.mailerUrl,
            body: {
                "from": config.mailFrom,
                "to": config.mailTo,
                "subject": mailSubject,
                "text": body,
                "html": htmlBody,
                "b64": fileContents,
                "fileName": fileName,
                "fileType": fileType
            },
            json: true
        };
        rp(options);
    }
    
}
