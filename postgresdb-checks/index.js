
const { PgDb } = require('./pg-db');
const latestTripCountCheckRepo = require('./latest-trip-count-check-repo');
const latestEventCountCheckRepo = require('./latest-event-count-check-repo')
const vehicleDeviceCountMatchCheckRepo = require('./vehicle-device-count-match-cosmos-pg')
const latestStoreUpdationCheckRepo = require('./latest_store-updation-check-repo');
const { environments } = require('../common/environments');

async function setupPGClient(env)
{
    let config = {}
    config.pgUser = env.infra.pg.user;
    config.pgHost= env.infra.pg.host;
    config.pgDatabase= env.infra.pg.dbname;
    config.pgPassword= env.infra.pg.password;
    config.pgPort= env.infra.pg.port;
    config.sslmode= env.infra.pg.sslmode;
    let Pgdb = new PgDb(config);
    return Pgdb;
}
module.exports = async function (context, myTimer) {   
    context = console;
    for(const env of environments)
    {
        if(env.infra.pg)
        {
            var Pgdb= await setupPGClient(env);
            await latestTripCountCheckRepo.performLatestTripCountCheck(context,Pgdb,env);
            await latestEventCountCheckRepo.performLatestEventCountCheck(context,Pgdb,env);
            await vehicleDeviceCountMatchCheckRepo.performVehicleDeviceCountMatch(context,Pgdb,env);
            await latestStoreUpdationCheckRepo.performLatestStoreUpdationCheck(context,Pgdb,env);
        }
    }
};