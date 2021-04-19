const rp = require("request-promise");
let config = require("./config");
const { pushConsumers } = require('../common/environments');
const isReachable = require("is-reachable");
const uuidV4 = require("uuid/v4");


async function sleep(timeoutMs) {
  return new Promise(resolve => {
    setTimeout(resolve, timeoutMs);
  });
}
async function main (context) {
  config.context = context;
  let results = [];
  for (let pushConsumer of pushConsumers) {
    let isSiteUp = await isReachableWithRetry(pushConsumer.url + "?serviceName=" + config.serviceName);
    if (!isSiteUp) {
      results.push(pushConsumer.name);
    }
  }
  if (results.length) {
    raisePagerDutyTrigger(results);
  }
  config.context.log("gm push consumer availability test ran!");
};

async function isReachableWithRetry(url) {
  const MAX_RETRIES = config.availabilityTestRetryCount;
  const MAX_BACKOFF_TIME_LIMIT = config.maxBackOffTimeLimit;
  let isSiteUp = false;
  for (let waitTimeBeforeNextRetry = 1, retryCount = 0; retryCount <= MAX_RETRIES; retryCount++, waitTimeBeforeNextRetry *= 2) {
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
      description: `GM push consumer down`,
      incident_key: `GM push consumer down ${uuidV4()}`,
      details: details
    },
    json: true
  };
  rp(options);
}

module.exports = main