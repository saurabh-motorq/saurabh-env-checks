require('dotenv').config();
const config = require("./config");
const latestTripCountCheckRepo = require('./latest-trip-count-check-repo');

module.exports = async function (context, myTimer) {   
    context = console; 
    await latestTripCountCheckRepo.performLatestTripCountCheck(context);
    // context.log('JavaScript timer trigger function ran!', timeStamp);  
};