
//api calls
//62.101.1.162 is efa.mobilitaetsagentur.bz.it
var STATIONBOARD_QUERY = 'http://62.101.1.162/apb/XSLT_DM_REQUEST?language=it&deleteAssignedStops_dm=1&trITMOTvalue100=7&useProxFootSearch=0&itdLPxx_today=10&mode=direct&lsShowTrainsExplicit=0&type_dm=any&includedMeans=checkbox&inclMOT_ZUG=1&inclMOT_BUS=1&inclMOT_8=1&inclMOT_9=1&locationServerActive=1&convertStopsPTKernel2LocationServer=1&convertAddressesITKernel2LocationServer=1&convertCoord2LocationServer=1&convertCrossingsITKernel2LocationServer=1&convertPOIsITKernel2LocationServer=1&stateless=1&itOptionsActive=1&ptOptionsActive=1&itdLPxx_depOnly=1&maxAssignedStops=1&hideBannerInfo=1&execInst=normal&limit=15&useAllStops=1&outputFormat=JSON&name_dm=';
//var STATIONBOARD_NEXT_QUERY = 'http://efa.mobilitaetsagentur.bz.it/apb/XSLT_DM_REQUEST?language=it&outputFormat=JSONrequestID=1&command=dmNext&itdLPxx_version=text&sessionID=' //I dont get the sessionID from the first call

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
var sortzzy = require('sortzzy');
var async = require("async");
var fs = require("fs");
var WebSocketServer = require('ws').Server;

var realtimeTI = require('./realtime');
var realtimeSASA = require('./realtimeSASA');

var configFile = fs.openSync("./config.json", "r");
var config = JSON.parse(fs.readFileSync(configFile));
fs.closeSync(configFile);

var log = new Log(config.logLevel);
var wss = new WebSocketServer({ port: config.port });

var busstopFile = fs.openSync("./data/allStopsWithSASA.json", "r");
var busstopList = JSON.parse(fs.readFileSync(busstopFile));
fs.closeSync(busstopFile);


log.info("WebSocket listening on " + config.port);

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
          stationboardRequest(message.query, message.time, ws);
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
  if (ws)
    ws.send(JSON.stringify({res: (query === "*")? busstopList : findSuggests(query), cb: "busstopResponse", id:query}));
}

//has to return an array of stops ({name: "name", city: "city", id: "id as number"})
function findSuggests(query) {
  // Create the model to match against 
  if (query !== undefined && query !== "") {
    var matching = [];
    for (i in busstopList) {
      matching.push({name: busstopList[i].it.name, city: busstopList[i].it.city, id: i });
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

function stationboardRequest(query, time, ws) {
  var list = [];
  var asyncTasks = [];
  var timeQuery = "";
  var isTrainStation = false; // have to save the trainstation into the main bustoplist

  //if (body.servingLines.trainInfo !== undefined)
  //isTrainStation = true;
  if (time) {
    timeQuery = "&itdDateDayMonthYear=" + moment(time).format("DD:MM:YYYY") + "&itdTime=" + moment(time).format("HHmm");
  }

  //add Task if there is a SASA bus
  if (busstopList[query].sasa !== undefined) {
    asyncTasks.push(function(callback){
      realtimeSASA(busstopList[query].sasa, function (data) {
        list = list.concat(data);
        callback();
      });
    });
  }

  //add Task if it is train station
  if (isTrainStation) {
    asyncTasks.push(function(callback){
      realtimeTI(query, time || (new Date()).toString(), function(trainList) {
        list = list.concat(trainList);
        trainList.forEach(function (train) {
          list.every(function (bus, index) {
            if (parseInt(bus.number) === parseInt(train.number) && 
                parseInt(bus.departure) === parseInt(train.departure)) {
              list.splice(index, 1);
              return false;
            }
            return true;
          });
        });
        callback();
      });
    });
  }


  asyncTasks.push(function(callback) {
    request({url: STATIONBOARD_QUERY + query + timeQuery,
      json: true,
      gzip: true,
      headers: {
        'Connection': 'keep-alive',
        'Accept-Encoding': 'gzip, deflate'
      }
    },
    function(err, res, body) {
      if(!err) {
        var departureList = body.departureList;
        var data = [];

        for (var i = 0; i < departureList.length; i++) {
          //don't save sasa buses
          if(departureList[i].operator.name !== "SASA S.p.A.")
            data.push(parseStationboard(departureList[i]));
        }
      }
      else
        log.error("HTTP error:", err);
      list = list.concat(data);
      callback();
    });
  });

  // Execute all async tasks in the asyncTasks array
  async.parallel(asyncTasks, function(){
    list.sort(function(a, b) {
      return (a.departure > b.departure) ? 1 : -1;
    });
    if (ws)
      ws.send(JSON.stringify({res: list.splice(0, 6), cb: "stationboardResponse", id: query}));
  });
}

function parseStationboard(el) {
  var res = {};
  var d = el.dateTime; //year, month, day, hour,	minute
  var trainNum = el.servingLine.trainNum;

  res.departure = moment(d.year + "-" + d.month + "-" + d.day + "," + d.hour + ":" + d.minute, "YYYY-MM-DD,HH:mm").valueOf();
  res.destination = el.servingLine.destID;
  res.name = el.servingLine.name;

  if (trainNum !== undefined)
    res.number = trainNum;
  else
    res.number = el.servingLine.number;
  return res;
}
