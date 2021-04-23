var config = require("./config");
const { environments } = require('../common/environments/index');
const pgRepo = require('./pg-repo')
async function performLatestStoreUpdationCheck(context)
{
    for(const env of environments){
        const latestStore = config.pgTables.latestStore;
        var latestStoreQuerySpec = {
            query: `SELECT count(*) AS count FROM ${latestStore} WHERE updated_timestamp > now() - interval '1 day'`
        };
        try{
            const latestUpdationCount = await pgRepo.queryPG(latestStoreQuerySpec.query);
            if (latestUpdationCount.rows[0].count>0) {
                    context.log('updates found in latest_store in the last 24 hours');
            } else {
                context.log('No updates found in latest_store in the last 24 hours');
                await pgRepo.insertAlertIntoPg(env.name,'LATEST_STORE_UPDATION_IN_POSTGRES','no updates found in latest_store in the last 24 hours' );
            }
        }
        catch(err){
            context.log(err);
            await pgRepo.insertAlertIntoPg(env.name,'LATEST_STORE_UPDATION_IN_POSTGRES', 'Check Failed');
        }
    }
}

module.exports = { performLatestStoreUpdationCheck };