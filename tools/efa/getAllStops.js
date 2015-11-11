var fs = require('fs');
var request = require('request');
var BUSSTOP_QUERY = 'http://efa.mobilitaetsagentur.bz.it/apb/XSLT_COORD_REQUEST?tdLPxx_x=677870&itdLPxx_y=349009&itdLPxx_mapName=APBV&coordOutputFormat=WGS84&coord=677870%3A349009%3AAPBV&inclFilter=1&purpose=7&max=-1&coordListFormat=JSON&itdLPxx_mdvMapName=mdvMap_mdvMap&coordListOutputFormat=JSON&scale=5669.000000&outputFormat=JSON&deadline=20151111&type_1=STOP&radius_1=999999999&inclDrawClasses_1='

//&coordOutputFormat=WGS84
getAllStops();

function getAllStops() {
  request({url: BUSSTOP_QUERY + "&language=de",
    json: true,
    gzip: true,
    headers: {
      'Connection': 'keep-alive',
      'Accept-Encoding': 'gzip, deflate'
    }
  },
  function(err, res, body) {
    var list = {};
    if(!err) {
      try {
        //console.log(body.pins);
        var count = 0;
        body.pins.forEach(function (element) {
          count ++;
          list[element.id] = parseStop(element); 
        });
        console.log(list);
      } catch (exc) {
        console.error("JSON parse error:", exc);
      }
    }
    else
      console.error("HTTP error:", err);
  });
}

function parseStop(el) {
  var res = {};
  res.name = el.desc;
  //res.id = el.id;
  res.coords = el.coords;
  res.city = el.locality;
  return res;
}

/*
{ desc: 'Bologna C.le Staz.',
  addDesc: '',
  type: 'STOP',
  id: '66007011',
  omc: '22015013',
  placeID: '1',
  locality: 'Bologna',
  layer: 'SYS-STOP',
  gisID: '66007011',
  distance: '220419',
  stateless: '66007011',
  coords: '11343320.61521,44505869.23952',
  attrs: [ [Object], [Object], [Object] ],
  infos: null }
  */
