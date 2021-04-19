let rp = require('request-promise');
let config = require('./config');
let zip = new require('node-zip')();
let btoa = require('btoa');
let stringify = require('csv-stringify');
const _ = require('lodash');
const tableStorage = require('./shared/table-storage');
const { appInsightConfigs } = require('../common/environments')

async  function main (context, req) {
    context.log('Starting exception-alerts');
    config.context=context;
    let mailBodyArray = [];
    for (let appInsightConfig of appInsightConfigs) {
        config.context.log(appInsightConfig['name']);
        let appId = appInsightConfig['appId'];
        let apiKey = appInsightConfig['key'];
        let name = appInsightConfig['name'];
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
        let responseInArrayFormat = await parseAppinsightsResponse(res, name);
        if (responseInArrayFormat.length > 0) {
            mailBodyArray.push(...responseInArrayFormat);
            let csvData = await convertToCsv(res);
            zip.file(name + '.csv', csvData);
        }
    }
    if (mailBodyArray.length > 0) {
        let zippedData = zip.generate({ base64: false, compression: 'DEFLATE' });
        let dataInB64 = btoa(zippedData);
        mailBodyArray.sort(function (a, b) {
            return b[b.length - 1] - a[a.length - 1];
        });
        let mailBody = composeMailBody(mailBodyArray);
        mail('errorAggregate.zip', 'application/zip', dataInB64, mailBody);
    }
};

async function groupSimilarExceptions(rows) {
    const exceptionsToGroup = await tableStorage.getEntityByPartitionKey(config.exceptionGroupingTable, 'common', []);
    const seenExceptions = {};
    const exceptionsToEmit = [];
    for(const row of rows) {
        let shouldIgnore = false;
        for(const message of exceptionsToGroup) {
            if(row[3].includes(message.innermostMessage)) {
                if(seenExceptions[message.innermostMessage]) {
                    shouldIgnore = true;
                    break;
                }
                seenExceptions[message.innermostMessage] = true
            }
        }
        if(!shouldIgnore) {
            exceptionsToEmit.push(row);
        }
    }
    return exceptionsToEmit
}

async function parseAppinsightsResponse(result, envName) {
    let rows = result['tables'][0]['rows'];
    let res = [];
    let exclusions = [];
    if(rows.length>0){
        const envSpecificExclusions = await tableStorage.getEntityByPartitionKey(config.exclusionTable,envName,[]);
        const commonExclusions = await tableStorage.getEntityByPartitionKey(config.exclusionTable,'common',[]);
        exclusions = _.concat(envSpecificExclusions,commonExclusions);
    }
    const groupedErrors = await groupSimilarExceptions(rows);
    for (let row of groupedErrors) {
        if (await isPriority(row,exclusions)) {
            res.push([envName, row[0], row[2].substring(0, 36), row[4], row[5]]);
        }
    }
    return res;
}

async function isPriority(row,exclusions) {
    let result = true;
    const innerMessage = row[3];
    const exceptionCount = row[5];
    for(const exclusion of exclusions){
        if(innerMessage && innerMessage.indexOf(exclusion.innermostMessage)>-1 && exceptionCount<exclusion.count15M){
            result =  false;
            break;
        }
    }
    return result 
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
  
    //TODo :  remove hard coding and parse freom header
    let headers = ['Env', 'Type', 'Outer Message', 'Custom Dimensions', 'Count'];
    let htmlBody = '<strong>Error Alerts for , cfapiv2qa and</strong><br></br>';
  

    let slicedMailBodyArray = mailBodyArray.slice(0, 50);
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

    const remainingEnvs = _.uniqBy(mailBodyArray.slice(50).map(item => item[0]));
    if(remainingEnvs.length) {
        htmlBody += '<strong> Found valid exception alerts in the following environments as well:</strong>'
        for (let env of remainingEnvs) {
            htmlBody += `<strong> ${env} </strong>`
        }
    }
    
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
            "files": [{fileName, fileType, content: fileContents}],
        },
        json: true
    };

    rp(options);
}
module.exports = main