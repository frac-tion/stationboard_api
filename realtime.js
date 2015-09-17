var logLevel = 'warning';

//var DEPARTURE_STATION_URL = "http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/cercaNumeroTrenoTrenoAutocomplete/";
//var REALTIME_TRAIN_URL = "http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/andamentoTreno/" //IDStazionePartenza/numeroTreno
var FIND_STATION_ID_API = "http://viaggiatreno.it/viaggiatrenomobile/resteasy/viaggiatreno/autocompletaStazione/"
var STATION_DEPARTURES_API = "http://viaggiatreno.it/viaggiatrenomobile/resteasy/viaggiatreno/partenze/" //IDStazione/{date.toString()}

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

var log = new Log(logLevel);

//var date = new Date();
//realtimeTrenitaliaByStation("trento", date.toString());

/*function realtimeTrenitaliaByTrain(trainId, callback) {
	departureStation(trainId);

	//calls trainDelay for delay
	function departureStation(query) {
		request({url: DEPARTURE_STATION_URL + query,
			gzip: true,
			headers: {
				'Connection': 'keep-alive',
				'Accept-Encoding': 'gzip, deflate'
			}
		},
		function(err, res, body) {
			if(!err) {
				var lines = body.split("\n");
				if (lines.length < 2 || lines[1] == '') {
					departure = lines[0].split("|")[1].split("-")[1];
					log.debug("Origin station: " + departure);
					trainDelay(departure + "/" + query);
				}
				else {
					log.warning("More than one train: \n" + body);
					departure = lines[0].split("|")[1].split("-")[1];
					//trainDelay(departure + "/" + query);
				}
			}

		});
	}

	function trainDelay(query) {
		request({url: REALTIME_TRAIN_URL + query,
			json: true,
			gzip: true,
			headers: {
				'Connection': 'keep-alive',
				'Accept-Encoding': 'gzip, deflate'
			}
		},
		function(err, res, body) {
			if(!err) {
				log.debug(body.ritardo);
				if(callback)
					callback(body.ritardo);
			}

		});
	}
}
*/


//gets departures of a train station
//callback: depature delays of all trains
function realtimeTrenitalia(stationName, dateTime, callback) {
	departureStation(stationName);

	//calls trainDelay for delay
	function departureStation(query) {
		request({url: FIND_STATION_ID_API  + query,
			gzip: true,
			headers: {
				'Connection': 'keep-alive',
				'Accept-Encoding': 'gzip, deflate'
			}
		},
		function(err, res, body) {
			if(!err) {
				var lines = body.split("\n");
				var stationId = lines[0].split("|")[1];
				if (lines.length < 2 || lines[1] == '') {
					log.debug("Station ID: " + stationId);
				}
				else {
					log.warning("More than one Station (I will take the first one): \n" + body);
				}
				stationDepartures(stationId + "/" + dateTime);
			}
		});
	}

	function stationDepartures(query) {
		request({url: STATION_DEPARTURES_API + query,
			json: true,
			gzip: true,
			headers: {
				'Connection': 'keep-alive',
				'Accept-Encoding': 'gzip, deflate'
			}
		},
		function(err, res, body) {
			if(!err) {
				if (res.statusCode === 200) {
					if(callback)
						callback(parseStation(body));
				}
				else
					log.error("StatuCode: " + res.statusCode);
			}
			else
				log.error(err);
		});
	}
}

function parseStation(dep) {
	var res = {};
	dep.forEach(function (el) {
		log.debug(el.numeroTreno + " has a delay of " + el.ritardo + " min");
		res[el.numeroTreno] = el.ritardo;
	});
	return res;
}

module.exports = realtimeTrenitalia;
