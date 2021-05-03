const { insertAlertIntoPg } = require("./pg-repo");
var config = require("./config");

async function performEnrollmentCheck(database, context, env)
{
    var querySpec = {
        query: "select c.status as status from c where c.type='OPERATION' and c.operationType='enrollment' and c.createdTimestamp > DateTimeAdd('month',-10,GetCurrentDateTime()) order by c.createdTimestamp DESC OFFSET 0 LIMIT 100"
    };
    try{
        const container = database.container(env.infra.cosmos.collection.entitiesId);
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
        if (ratio >= config.enrollmentSuccessRatio) {
                context.log('More than required operations in the last month are successful');
        } else {
            context.log('less than required operations have succeeded in the last month');
            await insertAlertIntoPg(env.name,'ENROLLMENT_OPERATION_CHECK',{enrollmentSuccessRatio: ratio});
        }
    }
    catch(err){
        context.log(err);
        await insertAlertIntoPg(env.name,'ENROLLMENT_OPERATION_CHECK', {details: 'Enrollment operationWorking Check Failed'});
    }
}

module.exports = { performEnrollmentCheck };