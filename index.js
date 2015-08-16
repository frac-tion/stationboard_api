//config
var port = 8000;
var logLevel = 'debug';

//api calls
//62.101.1.162 is efa.mobilitaetsagentur.bz.it
var BUSSTOP_QUERY = 'http://62.101.1.162/apb/XSLT_STOPFINDER_REQUEST?language=de&outputFormat=JSON&itdLPxx_usage=origin&useLocalityMainStop=true&doNotSearchForStops_sf=1&SpEncId=1&odvSugMacro=true&name_sf=';
var STATIONBOARD_QUERY = 'http://62.101.1.162/apb/XSLT_DM_REQUEST?language=de&deleteAssignedStops_dm=1&trITMOTvalue100=7&useProxFootSearch=0&itdLPxx_today=10&mode=direct&lsShowTrainsExplicit=0&type_dm=any&includedMeans=checkbox&inclMOT_ZUG=1&inclMOT_BUS=1&inclMOT_8=1&inclMOT_9=1&locationServerActive=1&convertStopsPTKernel2LocationServer=1&convertAddressesITKernel2LocationServer=1&convertCoord2LocationServer=1&convertCrossingsITKernel2LocationServer=1&convertPOIsITKernel2LocationServer=1&stateless=1&itOptionsActive=1&ptOptionsActive=1&itdLPxx_depOnly=1&maxAssignedStops=1&hideBannerInfo=1&execInst=normal&limit=15&useAllStops=1&outputFormat=JSON&name_dm=';

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
var moment = require('moment');
var sortBy = require("sort-array");
var WebSocketServer = require('ws').Server;

var log = new Log(logLevel);
var wss = new WebSocketServer({ port: port });

log.info("WebSocket listening on " + port);

wss.on('connection', function connection(ws) {
	log.info("New client connected");
	ws.on('message', function incoming(message) {
		log.info('received: %s', message);
		try {
			message = JSON.parse(message);
			if (message.call !== undefined && message.query !==undefined) {
				if (message.call == "busstopRequest")
					busstopRequest(message.query, ws);
				else if (message.call == "stationboardRequest")
					stationboardRequest(message.query, ws);
				else
					log.info("Unknown call");
			}
			else
				log.info("Missing argument");
		} catch (exc) {
			log.error("JSON parse error:", exc);
		}
	});
});

function busstopRequest(query, ws) {
	var list = [];
	console.time("Request Time");
	request(BUSSTOP_QUERY + query, function(err, res, body) {
		console.timeEnd("Request Time");
		if(!err) {
			try {
				var busstopList = JSON.parse(body).stopFinder.points;
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
				log.debug("Busstop List:", JSON.stringify(list));
				if (ws)
					ws.send(JSON.stringify({res: list, cb: "busstopResponse"}));
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

function stationboardRequest(query, ws) {
	var list = [];
	request(STATIONBOARD_QUERY + query, function(err, res, body) {
		if(!err) {
			try {
				var departureList = JSON.parse(body).departureList;
				for (var i = 0; i < departureList.length; i++) {
					list.push(parseStationboard(departureList[i]));
				}
				log.debug("Stationboard List:", JSON.stringify(list));
				if (ws)
					ws.send(JSON.stringify({res: list, cb: "stationboardResponse"}));
			} catch (exc) {
				log.error("JSON parse error:", exc);
			}
		}
		else
			log.error("HTTP error:", err);
	});
}

function parseStationboard(el) {
	var res = {};
	/*year, month, day, hour,	minute*/
	var d = el.dateTime;
	/*2013-10-21T13:28:06.419Z*/
	res.dateTime = moment(d.year + "-" + d.month + "-" + d.day + "," + d.hour + ":" + d.minute, "YYYY-MM-DD,HH:mm").format();
	res.countdown = el.countdown;
	res.direction = el.servingLine.direction;
	res.number = el.servingLine.number;
	res.symbol = el.servingLine.symbol;
	return res;
}
