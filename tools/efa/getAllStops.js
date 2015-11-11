var fs = require('fs');
var request = requere('request');
var BUSSTOP_QUERY = 'http://efa.mobilitaetsagentur.bz.it/apb/XSLT_COORD_REQUEST?language=de&itdLPxx_x=677870&itdLPxx_y=349009&itdLPxx_mapName=APBV&coordOutputFormat=WGS84&coord=677870%3A349009%3AAPBV&inclFilter=1&purpose=7&max=-1&coordListFormat=JSON&itdLPxx_mdvMapName=mdvMap_mdvMap&coordListOutputFormat=JSON&scale=5669.000000&outputFormat=JSON&deadline=20151111&type_1=STOP&radius_1=999999999&inclDrawClasses_1='

//&coordOutputFormat=WGS84
function getAllStops() {
  request({url: BUSSTOP_QUERY,
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
        var busstopList = body.pins;
        //parseBusstop(busstopList);
        console.log(busstopList);
      } catch (exc) {
        log.error("JSON parse error:", exc);
      }
    }
    else
      log.error("HTTP error:", err);
  });
}


