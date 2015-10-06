var logLevel = 'debug';

var DEPARTURE_STATION_URL = "http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/cercaNumeroTrenoTrenoAutocomplete/";
var REALTIME_TRAIN_URL = "http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/andamentoTreno/" //IDStazionePartenza/numeroTreno
var FIND_STATION_ID_API = "http://viaggiatreno.it/viaggiatrenomobile/resteasy/viaggiatreno/autocompletaStazione/"
var STATION_DEPARTURES_API = "http://viaggiatreno.it/viaggiatrenomobile/resteasy/viaggiatreno/partenze/" //IDStazione/{date.toString()}

var WebSocket = require('ws');

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




process.on('beforeExit', function(code) {
  var ws = new WebSocket('ws://localhost:8000');
  ws.on('message', function(data, flags) {
    data = JSON.parse(data);
    console.log(data.cb);
    cbList[data.cb](data.res);
  });

  var cbList = {};
  cbList.busstopResponse = function (data) {
    var sii = parseSiiData(data);
    var vt = mainList;
    match(sii, vt);
  }

  ws.on('open', function open() {
    ws.send(JSON.stringify({call:"busstopRequest", query:"stazione"}));
  });
});

function  parseSiiData(data) {
  var res = {};
  data.forEach(function (i) {
    res[i.id] = i.name + " " + i.city;
  });
  return res;
}

function match(a, b) {
  b.forEach(function(eOfB) {
    a.forEach(function(eOfA) {
    
  }
}
