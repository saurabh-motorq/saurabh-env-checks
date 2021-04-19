const { SourceType,  Environment } =  require("./enum");
const utility = require("./utility");

const config = require('./config');

class PollerSyncChecker {

    constructor({sourceType, environment, context, datastore}) {
        this.source = sourceType;
        this.environment = environment;
        this.context = context;
        this.datastore = datastore
    }

    async getSourceOffsets(){}

    async getPollerOffsets(){}

    async matchOffsets({sourceOffsets, pollerOffsets}){}

    async run() {
        const failures = [];
       
        try{
            const sourceOffsets = await this.getSourceOffsets();
            const pollerOffsets = await this.getPollerOffsets();
            const anomalies = await this.matchOffsets({sourceOffsets, pollerOffsets});
            failures.push(...anomalies);
        }
        catch(err){
            const message = `Sync check for ${this.source} failed in ${this.environment} environment due to exception: ${JSON.stringify(err)}}`;
            failures.push(message);
        }


        if (failures.length) {
            this.context.log(failures);
            this.triggerFailure(failures);
        }
        else {
            this.context.log(`Poller is in sync for ${this.source} in ${this.environment} environment`);
        }
    }

    triggerFailure(failureMessages) {
        const context = this.context;
        let body = `<strong> Below failures were encountered in ${this.environment} for ${this.source}  </strong><br>`;
        for (let singleResponse of failureMessages) {
            body += `<li> ${singleResponse} </li>`
        }
        const mailSubject = `${this.source} pollers are lagging behind in ${this.environment} environment`;
        utility.mail({ htmlBody: body, body, mailSubject });
    }
    
}

module.exports = {PollerSyncChecker};