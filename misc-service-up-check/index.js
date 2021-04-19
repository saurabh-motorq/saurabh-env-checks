const rp = require("request-promise");
let config = require("./config");
const isReachable = require("is-reachable");
const uuidV4 = require("uuid/v4");


async function sleep(timeoutMs) {
  return new Promise(resolve => {
    setTimeout(resolve, timeoutMs);
  });
}

module.exports = async function(context) {
  config.context = context;
  const services = config.services
  let results = [];
  for (const service of services) {
    let isSiteUp = await isReachableWithRetry(service.url + "?serviceName=" + config.serviceName);
    if (!isSiteUp) {
      results.push(service.name);
    }
  }
  if (results.length) {
    raisePagerDutyTrigger(results);
  }
  config.context.log("misc service availability test ran!");
};

async function isReachableWithRetry(url) {
  const MAX_RETRIES = config.availabilityTestRetryCount;
  const MAX_BACKOFF_TIME_LIMIT = config.maxBackOffTimeLimit;
  let isSiteUp = false;
  for ( let waitTimeBeforeNextRetry = 1,retryCount=0; retryCount <= MAX_RETRIES; retryCount++, waitTimeBeforeNextRetry *= 2) {
    isSiteUp = await isReachable(url);
    if (!isSiteUp && retryCount < MAX_RETRIES) {
      await sleep(Math.min(waitTimeBeforeNextRetry, MAX_BACKOFF_TIME_LIMIT) * 1000);
    } 
    else {
      break;
    }
  }
  return isSiteUp;
}


function raisePagerDutyTrigger(parsedResult, context) {
  config.context.log("sending pager duty trigger");
  config.context.log(parsedResult);
  let details = {
    details: parsedResult
  };
  let uri = "https://events.pagerduty.com/generic/2010-04-15/create_event.json";
  let service_key = config.pagerDutyCriticalKey;
  let options = {
    method: "POST",
    uri,
    body: {
      service_key,
      event_type: "trigger",
      description: `Service api down`,
      incident_key: `Service down ${uuidV4()}`,
      details: details
    },
    json: true
  };
  rp(options);
}
