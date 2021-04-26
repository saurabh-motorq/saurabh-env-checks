const { components } = require('./components');
const config = require('../webjob-heart-beat-monitor/config');
const _ = require('lodash');
const fs = require('fs');

function main() {
    const envs = {};
    for (let queryConfig of config.queryConfigs) {
        if (!queryConfig.envName) {
            console.log('envName missing in ', queryConfig);
            return
        }
        if (!envs[queryConfig.envName]) {
            envs[queryConfig.envName] = {
                name: queryConfig.envName,
                infra: {
                    ai: {
                        id: queryConfig.appId,
                        key: queryConfig.apiKey,
                    },
                    cosmos: {
                        endpoint: '',
                        key: '',
                        db: '',
                        entitiesId: '',
                        telematicsId: ''
                    },
                    pager: {
                        criticalKey: queryConfig.pagerDutyCriticalKey
                    },
                    pg: {
                        user: '',
                        host: '',
                        password: '',
                        dbname: '',
                        port: '',
                        sslmode: '',
                        tables: {
                            
                        }
                    },
                    eh: {

                    },
                    storage: {

                    },
                    auth0: {

                    }
                },
                components: {},
                disabledHeartbeats: ['Trips fetch heartbeat', 'Trips push heartbeat']
            }
        }
        if (queryConfig.searchKey == 'lat/lon sync heartbeat') {
            envs[queryConfig.envName].disabledHeartbeats.push('lat lon sync heartbeat')
        } else if (queryConfig.searchKey == 'lat lon sync heartbeat') {
            envs[queryConfig.envName].disabledHeartbeats.push('lat/lon sync heartbeat')
        }
        const componentName = queryConfig.cloudRoleName.replace(/-\d$/, '')
        const components = envs[queryConfig.envName].components;
        const group = getComponentGroupName(componentName);
        if (!components[group]) {
            components[group] = {}
        }
        if (!components[group][componentName]) {
            components[group][componentName] = {}
            components[group][componentName].queryTablestore = queryConfig.queryTablestore
        }
        const multi = /-\d$/.test(queryConfig.cloudRoleName)

        if (multi) {
            const instanceCount = _.max([parseInt(_.last(queryConfig.cloudRoleName)) + 1, components[group][componentName].instanceCount]);
            components[group][componentName].instanceCount = instanceCount;
        }
    }
    createEnvFiles(envs)
}

function createEnvFiles(envs) {
    for (const env of Object.keys(envs)) {
        const fileName = env.toLowerCase().replace(/_/g, '-')
        fs.writeFileSync(`common/environments/${fileName}.js`, `const enviroment = ${JSON.stringify(envs[env], null, 2)} \n module.exports = enviroment`)
    }
}

function getComponentGroupName(componentName) {
    for (const group of Object.keys(components)) {
        if (Object.keys(components[group]).includes(componentName)) {
            return group
        }
    }
    throw new Error(`Couldn't find group for ${componentName}`)
}

main();