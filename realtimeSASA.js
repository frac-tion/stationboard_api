//gets in input a SASA busstop id and returns the departures in this format [{departure: Time, destination: "destination", name: "Linea", number: "211", delay: 0}]
var logLevel = 'error';

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
var STATIONBOARD_QUERY = "http://stationboard.opensasa.info/?type=json&ORT_NR=";
var log = new Log(logLevel);

function getDep(id, callback) {
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
          var time = (new Date((new Date).toISOString().split("T")[0] + "T" + ride.departure)).getTime();
          res.push({departure: time, destination: ride.last_station, number: ride.lidname , delay: ((ride.delay_sec/60) + ride.delay_min), color: ride.hexcode});
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

module.exports = getDep;
