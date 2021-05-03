const { insertAlertIntoPg } = require("./pg-repo");

async function performDuplicateDpsCheck(database, context, env)
{
    var querySpec = {
        query: "select r.deviceId as deviceId, r.dpsCount from ( select c.dId as deviceId, count(1) as dpsCount from c where c.type = 'DEVICEPROCESSINGSTATE' group by c.dId) r where r.dpsCount > 1"
    };

    try{
        const container = database.container(env.infra.cosmos.collection.telematicsId);
        const { resources: duplicateDps} = await container.items.query(querySpec).fetchAll();
        if (duplicateDps.length === 0) {
                context.log('No duplicate dps found');
                
        } else {
            context.log('duplicate dps found');
            await insertAlertIntoPg(env.name,'COSMOS_DUPLICATE_DPS',{details: duplicateDps});
        }
    }
    catch(err){
        context.log(err);
        await insertAlertIntoPg(env.name,'COSMOS_DUPLICATE_DPS', {details: 'Duplicate Dps Check Failed'});
    }
}

module.exports = { performDuplicateDpsCheck };