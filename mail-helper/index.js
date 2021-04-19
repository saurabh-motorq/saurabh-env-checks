const config = require('./config')
const sgMail = require('@sendgrid/mail');
const apiKey = config.sendgridKey;
const {
    classes: {
        Attachment
    }
} = require('@sendgrid/helpers');

module.exports = async function mail(context, req) {
    context.log('Trigger Function Starting');

    let files = req.body.files;
    let from = req.body.from;
    let to = req.body.to;
    let subject = req.body.subject;
    let text = req.body.text;
    let html = req.body.html;

    let attachments = [];
    new Promise(async (resolve, reject) => {
        try {
            if (files) {
                for(const file of files) {
                    let attachment = await getAttachment(file.fileName, file.fileType, file.content);
                    attachments.push(attachment);
                }
            }
            sgMail.setApiKey(apiKey);
            let msg = {
                to: to,
                from: from,
                subject: subject,
                text: text,
                html: html,
                attachments: attachments
            };
            context.log(JSON.stringify(msg));
            sgMail.send(msg);
            context.log('Mail Sent');
            resolve();
        } catch (error) {
            console.log(error);
            reject(error);

        }
    });
};


async function getAttachment(fileName, fileType, b64) {
    let attachment = new Attachment({
        filename: fileName,
        type: fileType,
        disposition: 'attachment',
        contentId: 'AbTestResult',
        content: b64
    });
    return attachment;
}