var logLevel = 'debug';

//var DEPARTURE_STATION_URL = "http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/cercaNumeroTrenoTrenoAutocomplete/";
var REALTIME_TRAIN_URL = "http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/andamentoTreno/" //IDStazionePartenza/numeroTreno
//var FIND_STATION_ID_API = "http://viaggiatreno.it/viaggiatrenomobile/resteasy/viaggiatreno/autocompletaStazione/"
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
  '66007019': 'S05319'};

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
  var async = require('async');

  var log = new Log(logLevel);


  //gets departures of a train station from a SII id and uses the lookup table to get the trenitalia station id
  //callback: depature delays of all trains
  function realtimeTrenitalia(stationId, time, finalCallback) {
    var dateTime = (new Date(time)).toString();
    if (lookup[stationId] != undefined) {
      var query = STATION_DEPARTURES_API + lookup[stationId] + "/" + dateTime;
      console.log(query);
      log.debug(query);
      request({url: query,
              json: true,
              gzip: true,
              headers: {
                'Connection': 'keep-alive',
                'Accept-Encoding': 'gzip, deflate'
              }
      },
      function(err, res, stationDep) {
        if(!err) {
          if (res.statusCode === 200) {
            //requestTrainDetails(stationDep, callback);
            var depList = [];
            async.each(stationDep, function(train, callback) {
              requestTrainDetails(train, function (list){
                depList = depList.concat(list);
                callback();
              });
            },
            function(err) {
              if (err)
                finalCallback([]);
              else
                finalCallback(depList);
            });

          }
          else {
            log.error("StatuCode: " + res.statusCode);
            finalCallback([]);
          }
        }
        else {
          log.error(err);
          finalCallback([]);
        }
      });
    }
    else
      finalCallback([]);
  }

  function parseTrainDetails(el) {
    var res = {};
    log.debug(el.numeroTreno + " has a delay of " + el.ritardo + " min");
    res.number = el.numeroTreno;
    res.destination = el.destinazione;
    res.departure = (new Date(el.orarioPartenza)).getTime();
    return res;
  }

  function requestTrainDetails(train, callback) {
    var query = REALTIME_TRAIN_URL + train.codOrigine + "/" + train.numeroTreno;
    request({url: query,
            json: true,
            gzip: true,
            headers: {
              'Connection': 'keep-alive',
              'Accept-Encoding': 'gzip, deflate'
            }
    },
    function(err, res, trainDetails) {
      if(!err) {
        var details = parseTrainDetails(train);
        details.destination = findId(trainDetails.idDestinazione);
        details.delay = trainDetails.ritardo;
        callback(details);
      }
    });
  }

  function findId(id) {
    for (var efaId in lookup) {
      if (lookup[efaId] == id)
        return efaId;
    }
  }

  function isTrainStation(id) {
    if (lookup[id] === undefined)
      return false;
    else
      return true;
  }

  module.exports = {};
  module.exports.query = realtimeTrenitalia;
  module.exports.isTrainStation = isTrainStation;
