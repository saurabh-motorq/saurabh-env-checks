const { SourceType} = require('../enum');

/*
    FOR LOCAL DEV TESTING PURPOSE
*/


const localConfigs = {
    endpoint: 'https://motorq-internal-dev-eus2-serverless.documents.azure.com:443/',
	primaryKey: 'tsnvvqqy7buSGafoKL99rKG1iZLblXO5E72CMt7hMMXTZWAcuVCfS2XSkAPcO052RjFkmYQpRKJhl2jESLvxKQ==',
	database: {
		'id': 'core-fleet-replay'
	},
	collection: {
		'entitiesId': 'arshad-entities',
		'telematicsId': 'arshad-telematics',
		'sessionDataId': 'arshad-telematics'
	},
	[SourceType.Geotab]: {
		accounts: [
			{
				userName: 'vivek@motorq.co',
				password: '',
				database: 'motorq'
			}
		]
    },
    [SourceType.Ford]: null,
	[SourceType.Volkswagen]: null,
	[SourceType.Gm]: null
}


module.exports = { localConfigs };