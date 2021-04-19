const API = require('mg-api-js');
const Promise = require('bluebird');
const config = require('../config');
const datastore = require('../data-store');


module.exports = {

    getSingleFeedToVersion: async function (feedToGet, searchOptions, userName, password, database, session, context) {
        let singleFeed = null;
        try {
            const authentication = {
                credentials: {
                    database,
                    userName,
                    password
                },
                path: config.geotabServer
            }
            const settings = {
                rememberMe: true,
                fullResponse: true,
                timeout: config.geotabApiTimeout
            }
            const api = new API(authentication, settings);
            api._helper.cred.sessionId = session.sessionId;
            api._helper.path = session.path;
            let options = {};
            options.search = searchOptions;
            options.typeName = feedToGet;
            options.resultsLimit = config.geotabResultsLimit;
            console.log({
                message: 'Calling Geotab from getSingleFeedToVersion with ' +
                    JSON.stringify({
                        feedToGet,
                        searchOptions
                    })
            });
            singleFeed = await api.call('GetFeed', options);
            if (singleFeed.data.error) {
                api._helper.cred.sessionId = null;
                //Will try to authenticate within sdk if sessionId is set to null
                singleFeed = await api.call('GetFeed', options);
            }
            return singleFeed.data.result.toVersion;
        } catch (err) {
            console.log(JSON.stringify(err));
            throw err;
        }
    },
    
    getMotorqAcccountId: async function (userName, database, datastore) {
        let querySpec = {
            query: 'SELECT r.id as id FROM root r WHERE r.type=@type and r.userName = @userName and r.db = @db',
            parameters: [{
                name: '@userName',
                value: userName
            },
            {
                name: '@db',
                value: database
            },
            {
                name: '@type',
                value: 'ACCOUNT'
            }
            ]
        };
        let result = await datastore.query(querySpec, null, true);
        if (result.length) {
            return result[0].id
        }
    }
}
