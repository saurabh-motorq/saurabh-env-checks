const { SourceType } = require("../enum");
const helper =  require("./helper");
const { PollerSyncChecker } = require("../poller-sync-checker");
const config = require("../config");
const moment = require('moment');
const _ = require('lodash');

class GeotabPollerSyncChecker extends PollerSyncChecker {

    constructor({sourceType, environment, context, datastore}) {
       super({sourceType, environment, context, datastore});
    }

    async getSourceOffsets() {
        const accounts = config[this.environment][SourceType.Geotab].accounts;
        const sourceOffsets = [];
        for (let geotabAccount of accounts) {
            const userName = geotabAccount.userName;
            const password = geotabAccount.password;
            const database = geotabAccount.database;
            let fromDate = moment().toISOString();
            let searchOptions = {
                fromDate
            };
            const feedTypes = [{name: "LogRecord"}, {name: "StatusData"}, {name: "FaultData"}];
            let motorqAccountId = await helper.getMotorqAcccountId(userName, database, this.datastore);
            for(const feedType of feedTypes) {
                const feedOffsetDetails = {
                    accountId: motorqAccountId,
                    feedType
                }
                try {
                    const session = this.datastore.getGeotabSessionData();
                    const result = await helper.getSingleFeedToVersion(feedType.name, searchOptions, userName, password, database, session, this.context);
                    feedOffsetDetails.toVersion = result
                }
                catch (error) {
                    let failureMsg = `Geotab call failed on ${this.environment} for db - ${database} for ${feedType.name}`;
                    this.context.log(failureMsg);
                    this.context.log(error);
                }
                sourceOffsets.push(feedOffsetDetails)
            }
        }
        return sourceOffsets;
    }

    async getPollerOffsets() {
        const accounts = config[this.environment][SourceType.Geotab].accounts;
        const pollerOffsets = [];
        for (let geotabAccount of accounts) {
            const userName = geotabAccount.userName;
            const database = geotabAccount.database;
            let motorqAccountId = await helper.getMotorqAcccountId(userName, database, this.datastore)
            const motorqData = await this.datastore.getGeotabPollerCheckpoints();
            const feedTypes = [{name: "LogRecord"}, {name: "StatusData"}, {name: "FaultData"}];
            for(const feedType of feedTypes) {
                const feedOffsetDetails = {
                    accountId: motorqAccountId,
                    feedType
                }
                const id = `Geotab-${feedType.name}-${motorqAccountId}`;
                const checkpoint = _.find(motorqData, {id});
                if(checkpoint) {
                    feedOffsetDetails.toVersion = checkpoint.offset;
                }
                pollerOffsets.push(feedOffsetDetails); 
            }
       }
       return pollerOffsets;
    }

    areToVersionsCloseToEachOther(toVersionA, toVersionB) {
        const decimalToVersionA = parseInt(toVersionA, 16);
        const decimalToVersionB = parseInt(toVersionB, 16);
        return Math.abs(decimalToVersionB - decimalToVersionA) < config.geotabPollerToVersionGapThreshold;
    }


    async matchOffsets({sourceOffsets, pollerOffsets}) {
        const accounts = config[this.environment][SourceType.Geotab].accounts;
        const failures = [];
        for(let geotabAccount of accounts) {
            const userName = geotabAccount.userName;
            const database = geotabAccount.database;
            let motorqAccountId = await helper.getMotorqAcccountId(userName, database, this.datastore);
            const feedTypes = [{name: "LogRecord"}, {name: "StatusData"}, {name: "FaultData"}];
            for (const feedType of feedTypes) {
                const pollerOffset = await _.find(pollerOffsets, {accountId: motorqAccountId, feedType});
                const sourceOffset = await _.find(sourceOffsets, {accountId: motorqAccountId, feedType});
                //need to decide on whether to raise alert for these conditions
                // if (!pollerOffset.toVersion) {
                //     failures.push(`${feedType.name} poller checkpoint not found for Geotab account- ${motorqAccountId} - ${database}`);
                // }
                // if (!sourceOffset.toVersion) {
                //     failures.push(`${feedType.name} api call failed for Geotab account - ${motorqAccountId} - ${database}`);
                // }
                if (pollerOffset.toVersion && sourceOffset.toVersion) {
                    if(!this.areToVersionsCloseToEachOther(pollerOffset.toVersion, sourceOffset.toVersion)) {
                        failures.push(`Geotab poller for account - ${motorqAccountId} ${database} not in sync for ${feedType.name} stream. ${JSON.stringify({pollerOffset: pollerOffset.toVersion, sourceOffset: sourceOffset.toVersion})}`);
                    }
                } 
            }
        }
        return failures;
    }
    
}

module.exports = { GeotabPollerSyncChecker };