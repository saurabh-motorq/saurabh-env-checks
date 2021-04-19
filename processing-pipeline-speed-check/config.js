require('dotenv').config();
let config = {};
config.query = `let totalRecords = customMetrics
| where  name =="totalRecordsToCommit";
let totalTime = customMetrics
| where  name =="fetchAndprocessTimeSec";
totalRecords
| extend batchId=tostring(customDimensions.batchId)
| project timestamp, name ,value,batchId
| join kind=leftouter (
    totalTime
    |extend batchId=tostring(customDimensions.batchId)
    | project name ,value,batchId
) on batchId
| project timestamp, timePerMessage=value1/value, messages=value ,processTime=value1,batchId
| order by messages desc`;

config.appId = "";
config.key = "";
config.cutOffTimeSec = 10;
config.pagerDutyNonCriticalKey = process.env.PAGER_DUTY_NON_CRITICAL_KEY;
config.timespan = 'PT1H';

module.exports = config;

module.exports = config;