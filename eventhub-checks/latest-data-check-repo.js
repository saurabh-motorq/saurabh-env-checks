require('dotenv').config();
const CosmosClient = require("@azure/cosmos").CosmosClient;
const { EventHubConsumerClient , earliestEventPosition }= require("@azure/event-hubs")
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
        let cosmos_ts=null;
        var querySpec = {
            query: "SELECT c._ts*1000 as ts FROM c order by c._ts DESC Offset 0 Limit 1"
        };
        try{
            const container = database.container(env.infra.cosmos.collection.telematicsId);
            const { resources: latestItem} = await container.items.query(querySpec).fetchAll();
            cosmos_ts = latestItem[0].ts;
        }
        catch(error){
            context.log("check failed due to cosmos db");
            insertAlertIntoPg(env.name,'EVENTHUB_COSMOS_LATEST_EVENT_TIME_DIFF', {details: 'check failed due to cosmos db'});
        }
        for(const key in env.infra.eh)
        {
            eventhubs = env.infra.eh;
            if(eventhubs[key].name && eventhubs[key].isCustomer === 1)
            {
                const connectionString = eventhubs[key].connection_string;
                const eventHubName = eventhubs[key].name;
                const consumerGroup = "$Default"; // name of the default consumer group
                try{
                    const consumerClient= new EventHubConsumerClient(consumerGroup, connectionString, eventHubName);
                    const subscription = await consumerClient.subscribe({
                        processEvents: async (events,partitionContext) => {
                            const latestEvent= partitionContext.lastEnqueuedEventProperties;
                            await subscription.close();
                            await consumerClient.close();
                            let eh_ts = latestEvent.enqueuedOn.getTime();
                            const dif = Math.abs(cosmos_ts - eh_ts)/1000;
                            if(dif < config.cosmos_event_hub_time_diff_in_seconds)
                            {
                                context.log(`difference between last enqueued event time in event hub ${eventhubs[key].name} and cosmos db latest item timestamp is less than ${config.cosmos_event_hub_time_diff_in_seconds} seconds`);
                            }
                            else{
                                context.log(`difference between last enqueued event time in event hub ${eventhubs[key].name} and cosmos db latest item timestamp is greater than ${config.cosmos_event_hub_time_diff_in_seconds} seconds`);
                                await insertAlertIntoPg(env.name,'EVENTHUB_COSMOS_LATEST_EVENT_TIME_DIFF', {details: `difference between last enqueued event time in event hub ${eventhubs[key].name} and cosmos db latest item timestamp is greater than ${config.cosmos_event_hub_time_diff_in_seconds} seconds`});
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
                    await insertAlertIntoPg(env.name,'EVENTHUB_COSMOS_LATEST_EVENT_TIME_DIFF', {details: `check failed for eventhub ${eventhubs[key].name}`});
                }
            }
        }
    }
}

module.exports = { performLatestDataCheck };