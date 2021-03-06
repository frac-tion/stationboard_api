//gets in input a SASA busstop id and returns the departures in this format [{departure: Time, destination: "destination", name: "Linea", number: "211", delay: 0}]
var logLevel = 'debug';

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
var async = require("async");
var fs = require("fs");
var moment = require("moment");
try {
  var busstopFile = fs.openSync("./data/allStopsWithSASA.json", "r");
  var busstopList = JSON.parse(fs.readFileSync(busstopFile));
  fs.closeSync(busstopFile);
} catch (e) {
  var busstopFile = "./data/allStopsWithSASA.json";
  var busstopList = JSON.parse(fs.readFileSync(busstopFile));
}
var STATIONBOARD_QUERY = "http://stationboard.opensasa.info/?type=json&ORT_NR=";
var log = new Log(logLevel);

function realtime(idList, time, finalCallback) {
  if (time == undefined)
    time = 0;
  log.debug("Async sasa request started");
  var res = [];
  async.each(idList, function(id, callback) {
    getDep(id, time, function (data){
      res = res.concat(data);
      callback();
    });
  },
  function(err){
    finalCallback(res);
  });
}

function getDep(id, time, callback) {
  request({url: STATIONBOARD_QUERY + id,
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
        var res = [];
        body.rides.forEach(function (ride) { 
          try {
            var delay =  Math.round((ride.delay_sec/60) + ride.delay_min);
            var depTime = moment()
            .hours(ride.departure.split(":")[0])
            .minute(ride.departure.split(":")[1])
            .seconds(0)
            .milliseconds(0)
            .valueOf();
            if ((depTime + (delay * 60000)) > time) {
              res.push({departure: depTime,
                       destination: findId(ride.passlist[ride.passlist.length - 1].ORT_NR),
                       number: ride.lidname,
                       delay: delay,
                       color: ride.hexcode});
            }
          } catch (exc) {
            log.debug("Ride has not all necessare felds:", exc);
          }
        });

      } catch (exc) {
        log.error("JSON parse error:", exc);
        res = [];
      }
    }
    else {
      log.error("HTTP error:", err);
      res = [];
    }

    if (callback)
      callback(res);
  });
}


function findId(id) {
  var result;
  //should break loop when result is defined
  for (var efaId in busstopList) {
    if (busstopList[efaId].sasa !== undefined) {
      busstopList[efaId].sasa.every(function (sasaId) {
        if (parseInt(id) === parseInt(sasaId)) {
          result = efaId;
          return false;
        }
        return true;
      });
      //return efaId;
    }
  }
  return result;
}

module.exports = realtime;
