var logLevel = 'debug';

var DEPARTURE_STATION_URL = "http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/cercaNumeroTrenoTrenoAutocomplete/";
var REALTIME_TRAIN_URL = "http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/andamentoTreno/" //IDStazionePartenza/numeroTreno
var FIND_STATION_ID_API = "http://viaggiatreno.it/viaggiatrenomobile/resteasy/viaggiatreno/autocompletaStazione/"
var STATION_DEPARTURES_API = "http://viaggiatreno.it/viaggiatrenomobile/resteasy/viaggiatreno/partenze/" //IDStazione/{date.toString()}

var BUSSTOP_QUERY = 'http://62.101.1.162/apb/XSLT_STOPFINDER_REQUEST?language=it&outputFormat=JSON&itdLPxx_usage=origin&useLocalityMainStop=true&doNotSearchForStops_sf=1&SpEncId=1&odvSugMacro=true&name_sf=';


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
var sortBy = require("sort-array");
var request = require('request');

var log = new Log(logLevel);
var mainList = [];

var date = new Date();
realtimeTrenitalia("bolzano", date.toString());

function trainStations(trainId) {
	request({url: REALTIME_TRAIN_URL + trainId,
		json: true,
		gzip: true,
		headers: {
			'Connection': 'keep-alive',
			'Accept-Encoding': 'gzip, deflate'
		}
	},
	function(err, res, body) {
		if(!err) {
			mainList = mergeJSON(mainList, parseStops(body.fermate));
		}

	});
}

function mergeJSON(a, b) {
	for (var p in a)
		b[p] = a[p];
	return b;
}

function parseStops(stopList) {
	var res = {}; 
	stopList.forEach(function (stop) {
		res[stop.id] = stop.stazione;
	});
	return res;
}


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
					log.debug("Station ID: " + stationId + ", Station name: " + stationName);
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
					depList = parseStation(body);
					console.log("DepList: " + depList);
					depList.forEach(trainStations);
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
	var noTrain = [];
	dep.forEach(function (el, i) {
		//console.log(el);
		noTrain[i] = el.codOrigine + "/" + el.numeroTreno;
	});
	return noTrain;
}




var readyToExit = false;
var printed = false;
process.on('beforeExit', function(code) {
	if (!readyToExit){
		//console.log(mainList);
		for (var i in mainList)
			busstopRequest("Stazione " + mainList[i], i);
		readyToExit = true;
	}
	else if(!printed) {
		printed = true;
		console.log(mainList);
	}

});

function  parseSiiData(data) {
	var res = {};
	data.forEach(function (i) {
		res[i.id] = i.name + " " + i.city;
	});
	return res;
}

function match(a, b) {
	console.log(a, b);
	for(var eOfB in b) {
		for(var eOfA in a) {
			var p = new RegExp(b[eOfB], "gi");
			var res = a[eOfA].search(p);
			if (res != -1)
				console.log(a[eOfA], b[eOfB]);
		}
	}
}

function busstopRequest(query, stationId) {
	var list = [];
	request({url: BUSSTOP_QUERY + query,
		json: true,
		gzip: true,
		headers: {
			'Connection': 'keep-alive',
			'Accept-Encoding': 'gzip, deflate'
		}
	},
	function(err, res, body) {
		if(!err) {
			try {
				//var busstopList = JSON.parse(body).stopFinder.points;
				//log.debug(body);
				var busstopList = body.stopFinder.points;
				if (busstopList !== null) {
					if (busstopList.point !== undefined) {
						list.push(parseBusstop(busstopList.point));
					}
					else {
						sortBy(busstopList, "quality");
						for (var i = 0; i < busstopList.length; i++) {
							if (busstopList[i].anyType == "stop") {
								list.push(parseBusstop(busstopList[i]));
							}
						}
					}
				}
				//log.debug("Busstop List:", (list));
				if (list.length == 1) {
				mainList[stationId] = {nameTrenitalia: mainList[stationId], idSii: list[0].id, nameSii: list[0].name + list[0].city}
				}
				else {
					var found = false;
					list.forEach(function (el) {
					if (!found && el.name.search(/Autostazione/gi) == -1) {
						mainList[stationId] = {nameTrenitalia: mainList[stationId], idSii: el.id, nameSii: el.name + el.city}
						found = true;
					}
					});
				}
			} catch (exc) {
				log.error("JSON parse error:", exc);
			}
		}
		else
			log.error("HTTP error:", err);
	});
}

function parseBusstop(el) {
	var res = {};
	res.name = el.object;
	res.city = el.posttown;
	res.id = el.stateless;
	return res;
}
