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
            envs[name] = []
        }

        const env = envs[name];
        console.log(name)
        const docdbAccessKey = settings.find(item => item.name == 'DOCDB_ACCESS_KEY');
        if (docdbAccessKey) {
            env.push({
                name: `${name.toUpperCase()}_COSMOS_KEY`,
                value: docdbAccessKey.value
            })
        }

        const ehkeys = [
            'EVENT_HUB_NAMESPACE',
            'GEOTAB_EVENT_HUB_NAMESPACE',
            'GM_SOURCE_XML_EVENT_HUB_NAMESPACE',
            'GM_EVENT_HUB_NAMESPACE',
            'CALAMP_EVENT_HUB_NAMESPACE',
			'TOYOTA_EVENT_HUB_NAMESPACE',
			'DAIMLERPRO_EVENT_HUB_NAMESPACE',
            'FORD_EVENT_HUB_NAMESPACE',
            'FLEET_COMPLETE_EVENT_HUB_NAMESPACE',
            'EMAIL_EVENTHUB_NAMESPACE',
            'ENROLLMENT_EVENTHUB_NAMESPACE',
            'TELEMATICS_POSTPROCESSOR_EVENTHUB_NAMESPACE'
        ]

        for (const ehKey of ehkeys) {
            setEh(settings, env, ehKey, name);
        }

        createEnvFiles(envs)
    }

    function createEnvFiles(envs) {
        for (const env of Object.keys(envs)) {
            const fileName = env.toLowerCase().replace(/_/g, '-')
            fs.writeFileSync(`common/access-keys/${fileName}.json`, JSON.stringify(envs[env], null, 2), 'utf8')
        }
    }

    function setEh(settings, env, key, name) {
        const obj = settings.find(item => item.name == key);
        if (obj) {
            env.push({
                name: `${name.toUpperCase()}_${key.toUpperCase().replace(/-/g, '_')}`,
                value: obj.value
            });
        }
    }
}

main();
