const { insertAlertIntoPg } = require("./pg-repo");
var config = require("./config");
const moment = require('moment');
const { environments } = require('../common/environments/index');
async function performDuplicateDpsCheck(database, context)
{
    for(const env of environments) {
        var querySpec = {
            query: "select r.deviceId as deviceId, r.dpsCount from ( select c.dId as deviceId, count(1) as dpsCount from c where c.type = 'DEVICEPROCESSINGSTATE' group by c.dId) r where r.dpsCount > 1"
        };

        try{
            const container = database.container(config.collection.telematicsId);
            const { resources: duplicateDps} = await container.items.query(querySpec).fetchAll();
            if (duplicateDps.length === 0) {
                    context.log('No duplicate dps found');
                    
            } else {
                context.log('duplicate dps found');
                const devicesWithDuplicateDps = duplicateDps.map(item => "device_id: " + item.deviceId + " dps_count: " + item.dpsCount);
                console.log(duplicateDps, env.name);
                await insertAlertIntoPg(env.name,'DUPLICATE_DPS_FOUND',devicesWithDuplicateDps);
            }
        }
        catch(err){
            context.log(err);
            await insertAlertIntoPg(env,'duplicate dps found', moment().toISOString, 'Duplicate Dps Check Failed');
        }
    }
}

module.exports = { performDuplicateDpsCheck };