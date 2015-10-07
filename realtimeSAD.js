var logLevel = 'debug';

var SAD_API = "http://www.sad.it/ferrovia/index.php?page=";

/*
 * Log level:
 *
 * 0 EMERGENCY system is unusable
 * 1 ALERT action must be taken immediately
 * 2 CRITICAL the system is in critical condition
 * 3 ERROR error condition
 * 4 WARNING warning condition
 * 5 NOTICE a normal but significant condition
 * 6 INFO a purely informational message
 * 7 DEBUG messages to debug an application
 */

var Log = require('log');
var request = require('request');
var cheerio = require('cheerio');

var log = new Log(logLevel);



realtimeSad();
function realtimeSad(stationId, dateTime, callback) {
	var apiList = ["mappe.mabo", "mappe.bzbrca&mappa=2_1", "mappe.bzbrca&mappa=2_2"];
	var resList = {};
	apiList.forEach(function (map) {
		request({url: SAD_API + map,
			gzip: true,
			headers: {
				'Connection': 'keep-alive',
				'Accept-Encoding': 'gzip, deflate'
			}
		},
		function(err, res, body) {
			if(!err) {
				if (res.statusCode === 200) {
					//log.debug(body);
					//trainDelay(body, callback);
					//trainDelays(el.codOrigine + "/" + el.numeroTreno);
					//if(callback)
					//  callback(parseStation(body));
					var $ = cheerio.load(body);
					var treno = $('.treno');
					while (treno.length > 0) {
						var curr = treno.first().text();
						var res = {};

						//search for delay
						var delayPos = curr.indexOf('+');
						if (delayPos == -1)
							delayPos = curr.indexOf('- ');

						//search end of delay
						if (delayPos != -1) {
							var delay = curr.slice(delayPos, curr.indexOf('\n', delayPos));
						}

						var numberPos = curr.indexOf(String.fromCharCode(160));
						res.number = curr.slice(numberPos + 1, curr.indexOf(String.fromCharCode(160), numberPos + 1));
						var currDest = curr.replace(/  |\n/gi, "");
						var indexDest = currDest.lastIndexOf(String.fromCharCode(160));
						res.destination = currDest.slice(indexDest + 2).replace(/Staz./gi, 'Stazione');
						//log.debug(train.numeroTreno + " has a delay of " + train.ritardo + " min");
						//res.departure = (new Date(train.orarioPartenza)).getTime();
						res.delay = delay;

						resList[res.number] = res;
						console.log(resList);

						treno = treno.next()
					}
				}
				else
					log.error("StatuCode: " + res.statusCode);
			}
			else
				log.error(err);
		});
	});
}

module.exports = realtimeSad;
