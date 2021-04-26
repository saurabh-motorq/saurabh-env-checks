require('dotenv').config();
const CosmosClient = require("@azure/cosmos").CosmosClient;
const config = require("./config");
const { environments } = require('../common/environments/index');
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
async function setupCosmosdbClient(context, env)
{
    const endpoint = env.infra.cosmos.endpoint;
    const databaseId=env.infra.cosmos.database.id;
    const key= env.infra.cosmos.key;
    client = new CosmosClient({ endpoint, key });
    database = client.database(databaseId);
}

module.exports = async function (context, myTimer) {
    context=console;
    for(const env of environments) {
        if(env.infra.cosmos)
        {
            await setupCosmosdbClient(context,env);
            await checkDuplicateDpsRepo.performDuplicateDpsCheck(database,context,env);
            await enrolledVehiclesDevicesCountCheckRepo.performEnrolledVehiclesDevicesCountCheck(database,context,env);
            await vehiclesWithMultipleDevicesCountCeckRepo.performVehiclesWithMultipleDevicesCountCheck(database,context,env);
            await vehiclesWithNullVinCheckRepo.performNullVinCheck(database,context,env);
            await latestTripDataCheckRepo.performLatestTripDataCheck(database,context,env);
            await TTLTelematicsCheckRepo.performTTLTelematicsCheck(database,context,env);
            await TTLReferenceDataCheckRepo.performTTLReferenceDataCheck(database,context,env);
            await enrollmentCheckRepo.performEnrollmentCheck(database,context,env);
        }
    }
};