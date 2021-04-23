require('dotenv').config();
const CosmosClient = require("@azure/cosmos").CosmosClient;
const config = require("./config");
const checkDuplicateDpsRepo = require('./duplicate-dps-check-repo');
const enrolledVehiclesDevicesCountCheckRepo = require('./enrolled-vehicles-devices-count-check-repo');
const vehiclesWithMultipleDevicesCountCeckRepo = require('./vehicles-with-multiple-devices-count-check-repo');
const vehiclesWithNullVinCheckRepo = require('./vehicle-null-vin-check-repo');
const latestTripDataCheckRepo = require('./latest-trip-data-check-repo');
const TTLTelematicsCheckRepo = require('./ttl-telematics-check-repo');
const TTLReferenceDataCheckRepo = require('./ttl-reference-data-check-repo');
const enrollmentCheckRepo = require('./enrollment-check-repo');

let client= null;
let database =null;
async function setupCosmosdbClient(context)
{
    const endpoint = config.endpoint;
    const databaseId=config.database.id;
    const key= config.key
    client = new CosmosClient({ endpoint, key });
    database = client.database(databaseId);
}

module.exports = async function (context, myTimer) {
    context=console;
    await setupCosmosdbClient(context);
    await checkDuplicateDpsRepo.performDuplicateDpsCheck(database, context);
    await enrolledVehiclesDevicesCountCheckRepo.performEnrolledVehiclesDevicesCountCheck(database, context);
    await vehiclesWithMultipleDevicesCountCeckRepo.performVehiclesWithMultipleDevicesCountCheck(database,context);
    await vehiclesWithNullVinCheckRepo.performNullVinCheck(database,context);
    await latestTripDataCheckRepo.performLatestTripDataCheck(database,context);
    await TTLTelematicsCheckRepo.performTTLTelematicsCheck(database,context);
    await TTLReferenceDataCheckRepo.performTTLReferenceDataCheck(database,context);
    await enrollmentCheckRepo.performEnrollmentCheck(database,context);
};