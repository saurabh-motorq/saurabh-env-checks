const fs = require('fs')


function main() {
    const envs = {}
    const files = fs.readdirSync('all-appsettings')
    for (const file of files) {
        const settings = JSON.parse(fs.readFileSync(`all-appsettings/${file}`, 'utf-8'))
        const nameSetting = settings.find(item => item.name == 'CUSTOMER_NAME');
        if (!nameSetting) {
            continue;
        }

        const name = nameSetting.value;
        if (!envs[name]) {
            envs[name] = { name, infra: { eh: {}, cosmos: {} } }
        }

        const env = envs[name];

        const docdbAccessKey = settings.find(item => item.name == 'DOCDB_ACCESS_KEY');
        if (docdbAccessKey) {
            //env.infra.cosmos.cosmosKeyValue = docdbAccessKey.value;
            env.infra.cosmos.key = `|process.env.${name.toUpperCase()}_COSMOS_KEY|`;
        }

        const docdbEndpoint = settings.find(item => item.name == 'DOCDB_ENDPOINT');
        if (docdbEndpoint) {
            env.infra.cosmos.endpoint = docdbEndpoint.value;
        }

        const dbName = settings.find(item => item.name == 'DOCDB_NAME');
        if (dbName) {
            env.infra.cosmos.db = dbName.value;
        }

        const entities = settings.find(item => item.name == 'DOCDB_ENTITIES_COLLECTION');
        if (entities) {
            env.infra.cosmos.entitiesId = entities.value;
        }

        const telematics = settings.find(item => item.name == 'DOCDB_TELEMATICS_COLLECTION');
        if (telematics) {
            env.infra.cosmos.telematicsId = telematics.value;
        }

        const ehkeys = [
            'EVENT_HUB_NAMESPACE',
            'GEOTAB_EVENT_HUB_NAMESPACE',
            'GEOTAB_EVENT_HUB',
            'GEOTAB_EVENT_HUB_PARTITION_COUNT',
            'GEOTAB_UNBUFFERED_EVENT_HUB',
            'GEOTAB_UNBUFFERED_EVENT_HUB_PARTITION_COUNT',
            'GM_SOURCE_XML_EVENT_HUB_NAMESPACE',
            'GM_SOURCE_XML_EVENT_HUB',
            'GM_SOURCE_XML_EVENT_HUB_PARTITION_COUNT',
            'GM_EVENT_HUB_NAMESPACE',
            'GM_EVENT_HUB',
            'GM_EVENT_HUB_PARTITION_COUNT',
            'GM_UNBUFFERED_EVENT_HUB_PARTITION_COUNT',
            'GM_UNBUFFERED_EVENT_HUB',
            'CALAMP_EVENT_HUB_NAMESPACE',
            'CALAMP_EVENT_HUB',
            'CALAMP_EVENT_HUB_PARTITION_COUNT',
            'CALAMP_UNBUFFERED_EVENT_HUB',
            'CALAMP_UNBUFFERED_EVENT_HUB_PARTITION_COUNT',
            'TOYOTA_EVENT_HUB_NAMESPACE',
            'TOYOTA_EVENT_HUB',
            'TOYOTA_EVENT_HUB_PARTITION_COUNT',
            'TOYOTA_UNBUFFERED_EVENT_HUB',
            'TOYOTA_UNBUFFERED_EVENT_HUB_PARTITION_COUNT',
            'FORD_EVENT_HUB_NAMESPACE',
            'FORD_EVENT_HUB',
            'FORD_EVENT_HUB_PARTITION_COUNT',
            'FORD_UNBUFFERED_EVENT_HUB',
			'FORD_UNBUFFERED_EVENT_HUB_PARTITION_COUNT',
			'DAIMLERPRO_EVENT_HUB_NAMESPACE',
            'DAIMLERPRO_EVENT_HUB',
            'DAIMLERPRO_EVENT_HUB_PARTITION_COUNT',
            'DAIMLERPRO_UNBUFFERED_EVENT_HUB',
			'DAIMLERPRO_UNBUFFERED_EVENT_HUB_PARTITION_COUNT',
            'FLEET_COMPLETE_EVENT_HUB_NAMESPACE',
            'FLEET_COMPLETE_EVENT_HUB',
            'FLEET_COMPLETE_EVENT_HUB_PARTITION_COUNT',
            'FLEET_COMPLETE_UNBUFFERED_EVENT_HUB',
            'FLEET_COMPLETE_UNBUFFERED_EVENT_HUB_PARTITION_COUNT',
            'EMAIL_EVENTHUB_NAMESPACE',
            'EMAIL_EVENTHUB_NAME',
            'EMAIL_PARTITION_COUNT',
            'ENROLLMENT_EVENTHUB_NAMESPACE',
            'ENROLLMENT_EVENTHUB_NAME',
            'ENROLLMENT_EVENTHUB_PARTITION_COUNT',
            'TELEMATICS_POSTPROCESSOR_EVENTHUB_NAMESPACE',
            'TELEMATICS_POSTPROCESSOR_EVENTHUB',
            'TELEMATICS_POSTPROCESSOR_EVENT_HUB_PARTITION_COUNT'
        ]

        for (const ehKey of ehkeys) {
            setEh(settings, env, ehKey);
        }

        createEnvFiles(envs)
    }

    function createEnvFiles(envs) {
        for (const env of Object.keys(envs)) {
            const fileName = env.toLowerCase().replace(/_/g, '-')
            fs.writeFileSync(`common/environments/${fileName}.js`, `const enviroment = ${JSON.stringify(envs[env], null, 2)} \n module.exports = enviroment`)
        }
    }

    function setEh(settings, env, key) {
        const obj = settings.find(item => item.name == key);
        if (obj) {
            if (key.endsWith('NAMESPACE')) {
                env.infra.eh[`${key}`.toLocaleLowerCase()] = `|process.env.${env.name.toUpperCase()}_${key.toUpperCase().replace(/-/g, '_')}|`
            } else {
                env.infra.eh[`${key}`.toLocaleLowerCase()] = obj.value
            }
        }
    }
}

main();
