const { insertAlertIntoPg } = require("./pg-repo");
var config = require("./config");
const { environments } = require('../common/environments/index');
async function performNullVinCheck(database, context)
{
    for(const env of environments) {
        var querySpec = {
            query: "select count(1) as count from c where c.type='VEHICLE' and c.vin=null"
        };

        try{
            const container = database.container(config.collection.entitiesId);
            const { resources: vehicleCount} = await container.items.query(querySpec).fetchAll();
            // context.log(vehicleCount[0].count);
            if (vehicleCount[0].count === 0) {
                    context.log('No vehicle with null vin found');
            } else {
                context.log('Vehicles with null vin found');
                await insertAlertIntoPg(env.name,'VEHICLES_WITH_NULL_VIN','number of vehicles with null vin ' + vehicleCount[0].count);
            }
        }
        catch(err){
            context.log(err);
            await insertAlertIntoPg(env.name,'VEHICLES_WITH_NULL_VIN', 'Vehicles with null vin check failed');
        }
    }
}

module.exports = { performNullVinCheck };