require('dotenv').config();
const CosmosClient = require("@azure/cosmos").CosmosClient;
const pgRepo = require('./pg-repo')

let client= null;
let database =null;
async function setupCosmosdbClient(env)
{
    const endpoint= env.infra.cosmos.endpoint;
    const databaseId= env.infra.cosmos.database.id;
    const key= env.infra.cosmos.key
    client= new CosmosClient({ endpoint, key });
    database= client.database(databaseId);
}

async function vehicleCountMatch(env,clientPgdb,context){
    //cosmos vehicle count
    const container = database.container(env.infra.cosmos.collection.entitiesId);
    var cosmosVehicleQuerySpec = {
        query: "select count(1) as count from c where c.enrollmentStatus='ENROLLED' and c.type='VEHICLE'"
    };
    
    
    //pg vehicle count
    vehiclesTable= env.infra.pg.tables.vehicles;
    var pgVehicleQuerySpec = {
        query: `SELECT count(*) as count from ${vehiclesTable} as v WHERE v.active=true and v.vin!=NULL`
    }
    try{
        const { resources: cosmosVehicleCount} = await container.items.query(cosmosVehicleQuerySpec).fetchAll();
        const pgVehicleCount = await clientPgdb.query(pgVehicleQuerySpec.query);
        const diff = cosmosVehicleCount[0].count - pgVehicleCount.rows[0].count;
        if(diff === 0)
        {
            context.log("Same number of vehicles in cosmos and pg")
        }
        else{
            context.log('different number of vehicles found in cosmosDB and PostGres');
            pgRepo.insertAlertIntoPg(env.name,'VEHICLE_COUNT_MATCH_IN_COSMOS_AND_PG', 'no. of vehicles in cosmos - no. of vehicles in pg ' + diff);
        }
    }
    catch(err){
        context.log(err);
        pgRepo.insertAlertIntoPg(env.name, 'VEHICLE_COUNT_MATCH_IN_COSMOS_AND_PG', 'check failed');
    }
};

async function deviceCountMatch(env, clientPgdb,context){
    //cosmos device count
    const container = database.container(env.infra.cosmos.collection.entitiesId);
    var cosmosDeviceQuerySpec = {
        query: "select count(1) as count from c where c.type='DEVICE' and c.vin!= null"
    };

    //pg device count
    devicesTable = env.infra.pg.tables.devices;
    var pgDeviceQuerySpec = {
        query: `SELECT count(*) as count from ${devicesTable} WHERE activationtimestamp!=NULL`
    }
    try{
        const { resources: cosmosDeviceCount} = await container.items.query(cosmosDeviceQuerySpec).fetchAll();
        const pgDeviceCount = await clientPgdb.query(pgDeviceQuerySpec.query);
        
        const diff = cosmosDeviceCount[0].count - pgDeviceCount.rows[0].count;

        if(diff === 0)
        {
            context.log("Same number of devices in cosmos and pg")
        }
        else{
            context.log('different number of devices found in cosmosDB and PostGres');
            pgRepo.insertAlertIntoPg(env.name,'DEVICE_COUNT_MATCH_IN_COSMOS_AND_PG', 'no. of devices in cosmos - no. of devices in pg ' + diff);
        }
    }
    catch(err){
        context.log(err);
        pgRepo.insertAlertIntoPg(env.name, 'DEVICE_COUNT_MATCH_IN_COSMOS_AND_PG', 'check failed');
    }
};

async function performVehicleDeviceCountMatch(context,clientPgdb,env)
{
    if(env.infra.cosmos)
    {
        await setupCosmosdbClient(env);
        await vehicleCountMatch(env, clientPgdb, context);
        await deviceCountMatch(env, clientPgdb, context);
    }
};

module.exports = { performVehicleDeviceCountMatch };