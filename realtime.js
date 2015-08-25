var request = require("request");

//88 - VERONA PORTA NUOVA|88-S02430
//88 - BRESCIA|88-N00201
var DEPARTURE_STATION_URL = "http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/cercaNumeroTrenoTrenoAutocomplete/";
var REALTIME_TRAIN_URL = "http://www.viaggiatreno.it/viaggiatrenonew/resteasy/viaggiatreno/andamentoTreno/" //IDStazionePartenza/numeroTreno

realtime_Train("S00228/4640");

function realtime_Train(query) {
  request({url: REALTIME_TRAIN_URL + query,
    json: true,
    gzip: true,
    headers: {
      'Connection': 'keep-alive',
      'Accept-Encoding': 'gzip, deflate'
    }
  },
  function(err, res, body) {
    if(!err) {
        console.log(body);
    }

  });
}



//departureStation(4600);
//departureStation(88);
function departureStation(query) {
  console.time("Request Time");
  request({url: DEPARTURE_STATION_URL + query,
    gzip: true,
    headers: {
      'Connection': 'keep-alive',
      'Accept-Encoding': 'gzip, deflate'
    }
  },
  function(err, res, body) {
    console.timeEnd("Request Time");
    if(!err) {
      var lines = body.split("\n");
      if (lines.length < 2 || lines[1] == '') {
        departure = lines[0].split("|")[1].split("-")[1];
        console.log(departure);
      }
      else
        console.log(body);
    }

  });
}
