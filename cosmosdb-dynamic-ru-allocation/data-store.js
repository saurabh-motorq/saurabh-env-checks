var documentClient = require("documentdb").DocumentClient;
var config = require("./config");
var client = new documentClient(config.endpoint, { "masterKey": config.primaryKey });
var databaseUrl = `dbs/${config.database.id}`;

function readCollectionUrl(collectionId) {

    return new Promise((resolve, reject) => {
        var collectionUrl = `${databaseUrl}/colls/${collectionId}`;        
        client.readCollection(collectionUrl, (err, result) => {           
            if(err) {
                reject(err);
                return;
			}
		resolve(result._self);
    });
    });
}

function getOfferType(collection) {
    //Collections and OfferTypes are loosely coupled.
    //Offer.resource == collection._self And Offer.offerResourceId == collection._rid    
    //Therefore, to find the OfferType for a Collection, query for Offers by resourceLink matching collectionSelfLink

    var querySpec = {
        query: 'SELECT * FROM root r WHERE  r.resource = @link',
        parameters: [
            {
                name: '@link',
                value: collection
            }
        ]
    };
	return new Promise((resolve, reject) => {    
    client.queryOffers(querySpec).toArray(function (err, offers) {
        if (err) {
            reject(err);
                 
        } else if (offers.length === 0) {
            console.log('No offer found for collection');
            
        } else {
            console.log('Offer found for collection');
            var offer = offers[0];
            resolve(offer);
        }
	});
	});
}
function replaceOffer(offerBody,offerThroughput) {
	offerBody.content.offerThroughput=offerThroughput;
	return new Promise((resolve, reject) => {
		client.replaceOffer(offerBody._self, offerBody,(err, created) => {
            if (err) {
                reject(err);
            }
            else {
                console.log(`Updated offer`)
                resolve();
            }
        });
	});
}

let self = {
	readCollectionUrl,
	getOfferType,
	replaceOffer,
}

module.exports = self;
