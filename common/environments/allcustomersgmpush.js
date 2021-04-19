const enviroment = {
	"name": "allcustomersgmpush",
	"infra": {
		"ai": {
			"id": process.env.ALL_CUSTOMERS_GM_PUSH_APP_ID,
			"key": process.env.ALL_CUSTOMERS_GM_PUSH_APP_KEY
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
		"gm": {
			"gm-push-consumer": {
				url: process.env.GM_PUSH_CONSUMER_URL
			}
		},
		"common": {}
	},
	"disabledHeartbeats": []
}
module.exports = enviroment