var logLevel = 'debug';

//88 - VERONA PORTA NUOVA|88-S02430
//88 - BRESCIA|88-N00201
var DEPARTURE_STATION_URL = "http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/cercaNumeroTrenoTrenoAutocomplete/";
var REALTIME_TRAIN_URL = "http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/andamentoTreno/" //IDStazionePartenza/numeroTreno
var FIND_STATION_ID_URL = "http://viaggiatreno.it/viaggiatrenomobile/resteasy/viaggiatreno/autocompletaStazione/"
var STATION_DEPARTURES_URL = "http://viaggiatreno.it/viaggiatrenomobile/resteasy/viaggiatreno/partenze/" //IDStazione/{date.toString()}

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

var date = new Date();
realtimeTrenitaliaByStation("MERANO MAIA BASSA", date.toString());
//realtimeTrenitaliaByStation("MERANO");
//realtimeTrenitaliaByTrain(10705);
//realtimeTrenitalia(81);
function realtimeTrenitaliaByTrain(trainId, callback) {
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
					if(callback)
						callback();
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


function realtimeTrenitaliaByStation(trainId, dateTime, callback) {
	departureStation(trainId);

	//calls trainDelay for delay
	function departureStation(query) {
		request({url: FIND_STATION_ID_URL  + query,
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
					var station = lines[0].split("|")[1];
					log.debug("Station ID: " + station);
					stationDepartures(station + "/" + dateTime);
				}
				else {
					log.warning("More than one Station: \n" + body);
					if(callback)
						callback();
				}
			}

		});
	}

	function stationDepartures(query) {
		request({url: STATION_DEPARTURES_URL + query,
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
					log.debug(body);
					if(callback)
						callback(body);
				}
				else
					log.err("StatuCode: " + res.statusCode);
			}
			else
				log.error(err);


		});
	}
}

function parseTrain(el) {
	var res = {};
	res.delay = el.
	return res;
}
