const Promise = require("bluebird");
const moment = require('moment-timezone');
const config = require('./config');
const dataStore = require("./data-store");
const _ = require("lodash");

module.exports = async function (context) {
    const maxRus = 25000;
    const minRus = 20000;
    try {
        var timeStamp = new Date().toISOString();
        let collectionUrl = await dataStore.readCollectionUrl(config.collection.telematicsId);
        let telematicsOffer = await dataStore.getOfferType(collectionUrl);
        if(doesConditionMatchToReduceRu()){
            context.log(`Reducing RU's to ${minRus}`)
            await dataStore.replaceOffer(telematicsOffer, minRus);
        } else {
            context.log(`Increase RUs to ${maxRus}`)
            await dataStore.replaceOffer(telematicsOffer, maxRus);
        }
    } catch (error) {
        context.log(error)
    }
    context.log('JavaScript timer trigger function ran!', timeStamp);
};


function doesConditionMatchToReduceRu(){
	let dayOfWeek = moment().tz("America/Chicago").day();
	if(dayOfWeek==0 || dayOfWeek==6){
		return true;
	}
	let hour = moment().tz("America/Chicago").hour();

    // CST - 6:00 AM to 7:00 PM
    if(hour >= 6 && hour <= 19) {
        return false;
    }

    return true;
}