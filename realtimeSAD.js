var logLevel = 'debug';

var SAD_API = "http://www.sad.it/ferrovia/index.php?page=mappe.mabo"

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
var cheerio = require('cheerio');

var log = new Log(logLevel);



realtimeSad();
function realtimeSad(stationId, dateTime, callback) {
    request({url: SAD_API,
      gzip: true,
      headers: {
        'Connection': 'keep-alive',
        'Accept-Encoding': 'gzip, deflate'
      }
    },
    function(err, res, body) {
      if(!err) {
        if (res.statusCode === 200) {
          //log.debug(body);
          //trainDelay(body, callback);
          //trainDelays(el.codOrigine + "/" + el.numeroTreno);
          //if(callback)
          //  callback(parseStation(body));
          var $ = cheerio.load(body);
          var treno = $('.treno');
          while (treno.next().length > 0) {
            var delay = treno.first().text().indexOf('+');
            console.log(delay);

            treno = treno.next()
          }
        }
        else
          log.error("StatuCode: " + res.statusCode);
      }
      else
        log.error(err);
    });
}

function parseTrain(train) {
  var res = {};
    log.debug(train.numeroTreno + " has a delay of " + train.ritardo + " min");
    res.delay = train.ritardo;
    res.number = train.numeroTreno;
    res.destination = train.destinazione;
    res.departure = (new Date(train.orarioPartenza)).getTime();
  return res;
}


module.exports = realtimeSad;
