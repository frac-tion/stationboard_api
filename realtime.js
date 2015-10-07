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

var log = new Log(logLevel);


//gets departures of a train station from a SII id and uses the lookup table to get the trenitalia station id
//callback: depature delays of all trains
function realtimeTrenitalia(stationId, dateTime, callback) {
  stationDepartures(lookup[stationId] + "/" + dateTime);
  function stationDepartures(query) {
    log.debug(STATION_DEPARTURES_API + query);
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
          //log.debug(body);
          trainDelay(body, callback);
          //trainDelays(el.codOrigine + "/" + el.numeroTreno);
          //if(callback)
          //  callback(parseStation(body));
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
    res[el.numeroTreno].number = el.numeroTreno;
    res[el.numeroTreno].destination = el.destinazione;
    res[el.numeroTreno].departure = (new Date(el.orarioPartenza)).toJSON();
  });
  return res;
}

function trainDelay(list, callback) {
  var resultList = {};
  var count = 0;
  list.forEach(function (el) {
    request({url: REALTIME_TRAIN_URL + el.codOrigine + "/" + el.numeroTreno,
      json: true,
      gzip: true,
      headers: {
        'Connection': 'keep-alive',
        'Accept-Encoding': 'gzip, deflate'
      }
    },
    function(err, res, body) {
      if(!err) {
        //log.debug(parseTrain(body));
        count++;
        resultList[body.numeroTreno] = parseTrain(body);
        if (count == list.length)
          callback(resultList);
        }
    });
  })
}

function parseTrain(train) {
  var res = {};
    log.debug(train.numeroTreno + " has a delay of " + train.ritardo + " min");
    res.delay = train.ritardo;
    res.number = train.numeroTreno;
    res.destination = train.destinazione;
    res.departure = (new Date(train.orarioPartenza)).toJSON();
  return res;
}


module.exports = realtimeTrenitalia;
