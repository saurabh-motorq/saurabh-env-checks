const pgRepo = require('./pg-repo');
const { BlobServiceClient } = require('@azure/storage-blob');
const config = require('./config');

var report = {};
let containerClient = null;

async function setupContainerClient()
{
    const blobServiceClient = BlobServiceClient.fromConnectionString(config.storageConnectionString);
    const containerName = config.containerName;
    containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();
    console.log(containerClient);
}

function generateReport(values)
{
    for(const row of values.rows)
    {
        const env = row.environment_name;
        const type=row.type;
        if(!report[env])
        {
            report[env]={};
        }
        if(!report[env][type])
        {
            report[env][type]={failed_checks: 0, faults: []};
        }
        if(row.anomaly.toLowerCase().includes('check failed'))
            report[env][type].failed_checks++;
        else
            report[env][type]['faults'].push({timestamp: row.ts , anomaly: row.anomaly});
    }
}

async function uploadFullReport()
{
    var d= new Date();
    const blobName = `${d.getFullYear()}/${d.getMonth()}/${d.getDate()}/full report` + `.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.upload(JSON.stringify(report),Object.keys(report).length);
}
async function uploadBlobs(context)
{
    var d= new Date();
    try{
        for(const [key, value] of Object.entries(report))
        {
            const blobName= `${d.getFullYear()}/${d.getMonth()}/${d.getDate()}/${key}` + `.json`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            await blockBlobClient.upload(JSON.stringify(value),Object.keys(value).length);
        }
    }
    catch(err){
        context.log(err);
    }
}

module.exports = async function (context, myTimer) {
    context=console;
    try{
        var values = await pgRepo.queryAll();
        generateReport(values);
        await setupContainerClient();
        if(report)
        {
            await uploadBlobs(context);
            await uploadFullReport();
        }
    }
    catch(err){
        context.log(err);
    }
};