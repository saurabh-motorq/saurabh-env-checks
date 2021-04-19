const enviroment = {
	"name": "snowflake-archiver",
	"apiVersion": "v3",
	"infra": {
		"ai": {
			"id": process.env.SNOWFLAKE_ARCHIVER_APP_ID,
			"key": process.env.SNOWFLAKE_ARCHIVER_APP_KEY
		},
		"cosmos": {
			"endpoint": "",
			"key": "",
			"db": "",
			"entitiesId": "",
			"telematicsId": ""
		},
		"pager": {
			"criticalKey": ""
		},
		"pg": {},

		"storage": {},
		"auth0": {}
	},
	"components": {
		"common": {}
	},
	"disabledHeartbeats": []
}
module.exports = enviroment