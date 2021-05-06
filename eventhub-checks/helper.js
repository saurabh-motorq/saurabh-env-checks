function createEventhubHubMetricApiEndpoint(headers)
{
    if(headers.resourceUri && headers.apiVersion)
        {
        var endpoint = `https://management.azure.com/${headers.resourceUri}/providers/microsoft.insights/metrics?api-version=${headers.apiVersion}`;
        if(headers.aggregation)
        {
            endpoint = `${endpoint}&aggregation=${headers.aggregation}`; 
        }
        if(headers.filter)
        {
            endpoint = `${endpoint}&$filter=${headers.filter}`;
        }
        if(headers.timespan)
        {
            endpoint = `${endpoint}&timespan=${headers.timespan}`;
        }
        if(headers.interval)
        {
            endpoint = `${endpoint}&interval=${headers.interval}`;
        }
        if(headers.top)
        {
            endpoint = `${endpoint}&top=${headers.top}`;
        }
        if(headers.metricNames)
        {
            endpoint= `${endpoint}&metricnames=${headers.metricNames}`;
        }
        return endpoint;
    }
    else return '';
}

module.exports ={ createEventhubHubMetricApiEndpoint }