require('dotenv').config();
const CosmosClient = require("@azure/cosmos").CosmosClient;
const config = require("./config");
const checkDuplicateDpsRepo = require('./check-duplicate-dps-repo');
const enrolledVehiclesDevicesCountCheckRepo = require('./enrolled-vehicles-devices-count-check-repo');
const vehiclesWithMultipleDevicesCountCeckRepo= require('./vehicles-with-multiple-devices-count-check-repo');

let client= null;
let database =null;
async function setupCosmosdbClient(context)
{
    const endpoint = config.endpoint;
    const databaseId=config.database.id;
    const key= config.key
    console.log(endpoint);
    console.log(databaseId);
    client = new CosmosClient({ endpoint, key });
    database = client.database(databaseId);
}

module.exports = async function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    context=console;
    await setupCosmosdbClient(context);
    // await checkDuplicateDpsRepo.performDuplicateDpsCheck(database, context);
    // await enrolledVehiclesDevicesCountCheckRepo.performEnrolledVehiclesDevicesCountCheck(database, context);
    await vehiclesWithMultipleDevicesCountCeckRepo.performVehiclesWithMultipleDevicesCountCheck(database,context);
    // if (myTimer.isPastDue)
    // {
    //     context.log('JavaScript is running late!');
    // }
    context.log('JavaScript timer trigger function ran!', timeStamp);
};