//config
var port = 8000;
var logLevel = 'debug';

//api calls
//62.101.1.162 is efa.mobilitaetsagentur.bz.it
var BUSSTOP_QUERY = 'http://efa.mobilitaetsagentur.bz.it/apb/XSLT_STOPFINDER_REQUEST?language=it&outputFormat=JSON&itdLPxx_usage=origin&useLocalityMainStop=true&doNotSearchForStops_sf=1&SpEncId=0&odvSugMacro=true&coordOutputFormat=WGS84&name_sf=';

var STATIONBOARD_QUERY = 'http://62.101.1.162/apb/XSLT_DM_REQUEST?language=it&deleteAssignedStops_dm=1&trITMOTvalue100=7&useProxFootSearch=0&itdLPxx_today=10&mode=direct&lsShowTrainsExplicit=0&type_dm=any&includedMeans=checkbox&inclMOT_ZUG=1&inclMOT_BUS=1&inclMOT_8=1&inclMOT_9=1&locationServerActive=1&convertStopsPTKernel2LocationServer=1&convertAddressesITKernel2LocationServer=1&convertCoord2LocationServer=1&convertCrossingsITKernel2LocationServer=1&convertPOIsITKernel2LocationServer=1&stateless=1&itOptionsActive=1&ptOptionsActive=1&itdLPxx_depOnly=1&maxAssignedStops=1&hideBannerInfo=1&execInst=normal&limit=15&useAllStops=1&outputFormat=JSON&name_dm=';
var STATIONBOARD_NEXT_QUERY = 'http://efa.mobilitaetsagentur.bz.it/apb/XSLT_DM_REQUEST?language=it&outputFormat=JSONrequestID=1&command=dmNext&itdLPxx_version=text&sessionID=' //I dont get the sessionID from the first call

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
var sortzzy = require('sortzzy')
var fs = require("fs");
var WebSocketServer = require('ws').Server;

var realtime = require('./realtime');

var log = new Log(logLevel);
var wss = new WebSocketServer({ port: port });

var busstopFile = fs.openSync("./data/allStopsWithSASA.json", "r");
var busstopList = JSON.parse(fs.readFileSync(busstopFile));
fs.closeSync(busstopFile);


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
  //var list = [];
  //if (busstopList !== null) {
  // parseBusstop(busstopList[i]));
  //}
  //log.debug("Busstop List:", JSON.stringify(list));
  if (ws)
    ws.send(JSON.stringify({res: findSuggests(query), cb: "busstopResponse"}));
}
/*'66008513': 
  { de: { name: 'Martina', city: 'Tschlin' },
  coords: { latitude: 46.88575227405, longitude: 10.46425345025 },
  it: { name: 'Martina', city: 'Tschlin' } } }
  */


//has to return an array of stops ({name: "name", city: "city", id: "id as number"})
function findSuggests(query) {
  // Create the model to match against 
  if (query !== undefined && query !== "") {
    var matching = [];
    for (i in busstopList) {
      matching.push({name: busstopList[i].de.name, city: busstopList[i].de.city, id: i });
    }

    var model = {
      name: query || "",
      city: query || ""
    }

    // Define the fields  
    var fields = [
    {name: 'name', type: 'string', weight: 1, options: {ignoreCase: true}},
    {name: 'city', type: 'string', weight: 1, options: {ignoreCase: true}},
    ]

    var result = sortzzy.sort(matching, model, fields, {dataOnly: true});
    return result.slice(0, 20);
  }
  else
    return [];
}

function stationboardRequest(query, ws) {
  var list = [];
  request({url: STATIONBOARD_QUERY + query,
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
        //var departureList = JSON.parse(body).departureList;
        var departureList = body.departureList;

        var stationName = body.dm.points.point.object;
        var isTrainStation = false;
        var dateTime = new Date();

        if (body.servingLines.trainInfo !== undefined)
          isTrainStation = true;

        for (var i = 0; i < departureList.length; i++) {
          list.push(parseStationboard(departureList[i]));
          var trainNum = departureList[i].servingLine.trainNum;
        }
        log.debug("Stationboard List:", JSON.stringify(list));
        if (isTrainStation) {
          realtime(query, dateTime.toString(), function(delayList) {
            list.forEach(function(el) {
              if (delayList[el.number] !== undefined) {
                el.delay = delayList[el.number].delay;
                delete delayList[el.number];
              }
            });
            for (var el in delayList)
              list.unshift(delayList[el]);

            sortBy(list, "departure");
            log.debug(list);
            if (ws)
              ws.send(JSON.stringify({res: list, cb: "stationboardResponse"}));
          });
        }
        else {
          if (ws)
            ws.send(JSON.stringify({res: list, cb: "stationboardResponse"}));
        }
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
  //	log.debug(el.servingLine.trainNum);
  //	log.debug(addRealtime());
  /*2013-10-21T13:28:06.419Z*/
  res.departure = moment(d.year + "-" + d.month + "-" + d.day + "," + d.hour + ":" + d.minute, "YYYY-MM-DD,HH:mm").valueOf();
  //res.countdown = el.countdown;
  res.destination = el.servingLine.direction;

  //res.realtime = el.servingLine.realtime;
  res.name = el.servingLine.name;
  var trainNum = el.servingLine.trainNum;
  if (trainNum !== undefined)
    res.number = trainNum;
  else
    res.number = el.servingLine.number;
  //res.symbol = el.servingLine.symbol;
  return res;
}

function addRealtime() {
  return 0;
}
