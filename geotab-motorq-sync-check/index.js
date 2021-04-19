const Promise = require("bluebird");
const API = require("mg-api-node");
const rp = require('request-promise');
const moment = require("moment");
const config = require('./config');
const { GeotabPollerSyncChecker } = require('./geotab/poller-sync-checker');
const  { DataStore } = require("./data-store");
const { SourceType } = require("./enum");
const _ = require("lodash");

module.exports = async function (context, myTimer) {

    for(environment of config.environments) {
        try {
            const environmentConfigs = config[environment];
            context.log(environment, environmentConfigs);
            if(_.isUndefined(environmentConfigs)) {
                continue;
            }
            const datastore = new DataStore(environmentConfigs.endpoint, environmentConfigs.primaryKey, environmentConfigs.database, environmentConfigs.collection);
            for(sourceType of Object.values(SourceType)) {
                if(_.isNull(environmentConfigs[sourceType])) {
                    continue;
                }
                switch(sourceType) {
                    case SourceType.Geotab :
                        const geotabMonitor = new GeotabPollerSyncChecker({sourceType, environment, context, datastore});
                        await geotabMonitor.run();
                        break;
                }
            }
        }
        catch(err) {
            context.log(err);
            context.log(`Monitoring function failed for ${environment} environment due to exception: ${JSON.stringify(err)}`);
        }
    }  
};
