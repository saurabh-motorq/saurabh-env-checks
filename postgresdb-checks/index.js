require('dotenv').config();
const config = require("./config");
const latestTripCountCheckRepo = require('./latest-trip-count-check-repo');
const latestEventCountCheckRepo = require('./latest-event-count-check-repo')
const vehicleDeviceCountMatchCheckRepo = require('./vehicle-device-count-match-cosmos-pg')
module.exports = async function (context, myTimer) {   
    context = console;
    await latestTripCountCheckRepo.performLatestTripCountCheck(context);
    await latestEventCountCheckRepo.performLatestEventCountCheck(context);
    await vehicleDeviceCountMatchCheckRepo.performVehicleDeviceCountMatch(context);
    // context.log('JavaScript timer trigger function ran!', timeStamp);  
};