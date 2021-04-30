require('dotenv').config();
const CosmosClient = require("@azure/cosmos").CosmosClient;
const { EventHubConsumerClient , earliestEventPosition, latestEventPosition }= require("@azure/event-hubs")
const { insertAlertIntoPg } = require("./pg-repo");
const config = require("./config");

let database =null;
async function setupCosmosdbClient(env)
{
    const endpoint = env.infra.cosmos.endpoint;
    const databaseId=env.infra.cosmos.database.id;
    const key= env.infra.cosmos.key;
    let client = new CosmosClient({ endpoint, key });
    database = client.database(databaseId);
}

async function performLatestDataCheck(context,env)
{
    if(env.infra.cosmos)
    {
        setupCosmosdbClient(env);
        const connectionString = env.infra.eh.connection_string;
        const eventHubName = env.infra.eh.feed_event_hub;
        const consumerGroup = "$Default"; // name of the default consumer group
        var querySpec = {
            query: "SELECT c._ts*1000 as ts FROM c order by c._ts DESC Offset 0 Limit 1"
        };
        try{
            const consumerClient= new EventHubConsumerClient(consumerGroup, connectionString, eventHubName);
            const container = database.container(env.infra.cosmos.collection.telematicsId);
            const { resources: latestItem} = await container.items.query(querySpec).fetchAll();
            let cosmos_ts = latestItem[0].ts;
            const subscription = await consumerClient.subscribe({
                processEvents: async (events,context) => {
                    const latestEvent= await context.lastEnqueuedEventProperties;
                    await subscription.close();
                    await consumerClient.close();
                    let eh_ts = latestEvent.enqueuedOn.getTime();
                    if(Math.abs(cosmos_ts - eh_ts)/1000 < config.cosmos_event_hub_time_diff_in_seconds)
                    {
                        context.log(`difference between last enqueued event time in event hub and cosmos db latest item timestamp is less than ${config.cosmos_event_hub_time_diff_in_seconds} seconds`);
                    }
                    else{
                        await insertAlertIntoPg(env.name,'EVENTHUB_COSMOS_LATEST_EVENT_TIME_DIFF', {details: `difference between last enqueued event time in event hub and cosmos db latest item timestamp is greater than ${config.cosmos_event_hub_time_diff_in_seconds} seconds`});
                    }
                },
                processError: async(err,context) => {
                    context.log(err);
                },
            },
            {
                startPosition: earliestEventPosition,
                maxBatchSize: 1,
                maxWaitTimeInSeconds: 5,
                trackLastEnqueuedEventProperties: true
            }
            );
        }
        catch(err){
            context.log(err);
            await insertAlertIntoPg(env.name,'EVENTHUB_COSMOS_LATEST_EVENT_TIME_DIFF', {details: 'check failed'});
        }
    }
}

module.exports = { performLatestDataCheck };