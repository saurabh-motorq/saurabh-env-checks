let rp = require('request-promise');
let { environments } = require('../common/environments')

let config = require('./config');
let zip = new require('node-zip')();
let btoa = require('btoa');
let stringify = require('csv-stringify');
const _ = require('lodash');

async function main(context, req) {
    context.log('Starting Error Aggregation');
    let mailBodyArray = [];
    for (let environment of environments) {
        let appId = environment.infra.ai.id;
        let apiKey = environment.infra.ai.key;
        let name = environment.name;
        context.log(name)
        let uri = 'https://api.applicationinsights.io/v1/apps/' + appId + '/query';
        let options = {
            uri: uri,
            qs: {
                timespan: config.timespan,
                query: config.query
            },
            headers: {
                'x-api-key': apiKey
            },
            json: true
        };
        let res = await rp(options);
        context.log(res);
        let responseInArrayFormat = parseAppinsightsResponse(res, name);
        mailBodyArray.push(...responseInArrayFormat);
        let csvData = await convertToCsv(res);
        zip.file(name + '.csv', csvData);
    }
    let zippedData = zip.generate({ base64: false, compression: 'DEFLATE' });
    let dataInB64 = btoa(zippedData);
    mailBodyArray.sort(function (a, b) {
        return b[b.length - 1] - a[a.length - 1];
    });
    let mailBody = composeMailBody(mailBodyArray);
    mail('errorAggregate.zip', 'application/zip', dataInB64, mailBody);
};

function parseAppinsightsResponse(result, envName) {
    let rows = result['tables'][0]['rows'];
    let res = [];
    for (let row of rows) {
        res.push([envName, row[0], row[2].substring(0, 36), row[4], row[5]]);
    }
    return res;
}
async function convertToCsv(result) {
    let combinedRowdata = [];
    let columnsInCsvFile = [];
    let singleRowData = [];
    let columns = result['tables'][0]['columns'];
    for (let column of columns) {
        let name = column['name'];
        columnsInCsvFile.push(name);
    }

    let rows = result['tables'][0]['rows'];
    for (let row of rows) {
        for (let property of row) {
            singleRowData.push(property);
        }
        combinedRowdata.push(singleRowData);
        singleRowData = [];
    }
    return new Promise((resolve, reject) => {
        stringify(combinedRowdata, { header: true, columns: columnsInCsvFile }, (err, output) => {
            if (err) {
                reject(err);
            } else {
                resolve(output);
            }
        });
    });
}

function composeMailBody(mailBodyArray) {
    let slicedMailBodyArray = mailBodyArray.slice(0, 50);
    //TODo :  remove hard coding and parse freom header
    let headers = ['Env', 'Type', 'Outer Message', 'Custom Dimensions', 'Count'];
    let htmlBody = '<strong>Error Alerts for , cfapiv2qa and </strong><br></br>';

    htmlBody += '<table border="1"><tr>'
    for (let header of headers) {
        htmlBody += `<th>${header}</th>`;
    }
    htmlBody += '</tr>';

    for (let row of slicedMailBodyArray) {
        htmlBody += '<tr>'
        for (let cellValue of row) {
            htmlBody += `<td>${cellValue}</td>`;
        }
        htmlBody += '</tr>'
    }
    htmlBody += '</table>'
    return htmlBody;
}

function mail(fileName, fileType, fileContents, htmlBody) {
    let options = {
        method: 'POST',
        uri: config.mailerUrl,
        body: {
            "from": config.mailFrom,
            "to": config.mailTo,
            "subject": config.mailSubject,
            "text": config.mailText,
            "html": htmlBody,
            "b64": fileContents,
            "fileName": fileName,
            "fileType": fileType

        },
        json: true
    };
    rp(options);
}
module.exports = main;