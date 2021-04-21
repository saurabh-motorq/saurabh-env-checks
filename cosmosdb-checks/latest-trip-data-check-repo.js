const { insertAlertIntoPg } = require("./pg-repo");
var config = require("./config");
const { environments } = require('../common/environments/index');
async function performLatestTripDataCheck(database, context)
{
    for(const env of environments) {
        var querySpec = {
            query: "Select count(1) as count from c where c.type='TRIP' and c.ts_start > DateTimeAdd('DD',-1,GetCurrentDateTime())"
        };

        try{
            const container = database.container(config.collection.telematicsId);
            const { resources: tripCount} = await container.items.query(querySpec).fetchAll();
            // context.log(vehicleCount[0].count);
            if (tripCount[0].count !== 0) {
                    context.log('Trips found in last one day');
            } else {
                context.log('No trips found');
                await insertAlertIntoPg(env.name,'TRIPS_IN_LAST_DAY','no trips found in last one day');
            }
        }
        catch(err){
            context.log(err);
            await insertAlertIntoPg(env.name,'TRIPS_IN_LAST_DAY', 'Trips in last day check failed');
        }
    }
}

module.exports = { performLatestTripDataCheck };