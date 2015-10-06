var logLevel = 'debug';

//var DEPARTURE_STATION_URL = "http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/cercaNumeroTrenoTrenoAutocomplete/";
//var REALTIME_TRAIN_URL = "http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/andamentoTreno/" //IDStazionePartenza/numeroTreno
var FIND_STATION_ID_API = "http://viaggiatreno.it/viaggiatrenomobile/resteasy/viaggiatreno/autocompletaStazione/"
var STATION_DEPARTURES_API = "http://viaggiatreno.it/viaggiatrenomobile/resteasy/viaggiatreno/partenze/" //IDStazione/{date.toString()}

var lookup = { '66000210': 'S02216',
	'66000301': 'S02217',
	'66000454': 'S02223',
	'66000458': 'S02224',
	'66000468': 'S02026',
	'66000647': 'S02031',
	'66000661': 'S02037',
	'66000662': 'S02038',
	'66000663': 'S02034',
	'66000679': 'S02033',
	'66000696': 'S02032',
	'66000811': 'S02225',
	'66000998': 'S02014',
	'66001051': 'S02017',
	'66001092': 'S02020',
	'66001170': 'S02011',
	'66001385': 'S02005',
	'66001389': 'S02001',
	'66001393': 'S02006',
	'66001492': 'S02007',
	'66002132': 'S02059',
	'66002210': 'S02226',
	'66002294': 'S02219',
	'66002421': 'S02218',
	'66002424': 'S02222',
	'66002444': 'S02029',
	'66002460': 'S02030',
	'66007001': 'S02035',
	'66007002': 'S02044',
	'66007003': 'S02046',
	'66007005': 'S02049',
	'66007006': 'S02050',
	'66007009': 'S02055',
	'66007010': 'S02430',
	'66007011': 'S05043',
	'66007013': 'S05307',
	'66007014': 'S05310',
	'66007015': 'S05304',
	'66007016': 'S05308',
	'66007017': 'S05313',
	'66007018': 'S05316',
	'66007019': 'S05319'}

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
	function realtimeTrenitalia(stationId, dateTime, callback) {
/*		departureStation(stationName);

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
						log.debug("Station ID: " + stationId + ", Station name: " + stationName);
					}
					else {
						log.warning("More than one Station (I will take the first one): \n" + body);
					}
					stationDepartures(stationId + "/" + dateTime);
				}
			});
		}
*/
		stationDepartures(lookup[stationId] + "/" + dateTime);
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
		res[el.numeroTreno] = {};
		res[el.numeroTreno].delay = el.ritardo;
		res[el.numeroTreno].destiation = el.destinazione;
		res[el.numeroTreno].departure = (new Date(el.orarioPartenza)).toJSON();
	});
	return res;
}

module.exports = realtimeTrenitalia;
