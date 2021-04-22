const { insertAlertIntoPg } = require("./pg-repo");
var config = require("./config");
const { environments } = require('../common/environments/index');

async function performEnrollmentCheck(database, context)
{
    for(const env of environments) {
        var querySpec = {
            query: "select c.status as status from c where c.type='OPERATION' and c.operationType='enrollment' and c.createdTimestamp > DateTimeAdd('month',-10,GetCurrentDateTime()) order by c.createdTimestamp DESC OFFSET 0 LIMIT 100"
        };

        try{
            const container = database.container(config.collection.entitiesId);
            const { resources: enrollmentStatuses} = await container.items.query(querySpec).fetchAll();
            var count=0;
            for(let x in enrollmentStatuses)
            {
                if(enrollmentStatuses[x].status === 'succeeded')
                {
                    count++;
                }
            }
            var ratio = count/(enrollmentStatuses.length);
            if (ratio >= 0.9) {
                    context.log('More than 90% operations in the last month are successful');
            } else {
                context.log('less than 90% operations have succeeded in the last month');
                await insertAlertIntoPg(env.name,'ENROLLMENT_OPERATION_CHECK','Success ratio of enrollment operations is ' + ratio);
            }
        }
        catch(err){
            context.log(err);
            await insertAlertIntoPg(env.name,'ENROLLMENT_OPERATION_CHECK', 'Enrollment operationWorking Check Failed');
        }
    }
}

module.exports = { performEnrollmentCheck };