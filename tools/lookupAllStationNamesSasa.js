var request = require("request");
var request = require('request');
var fs = require('fs');
var BUSSTOP_QUERY = "http://efa.mobilitaetsagentur.bz.it/apb/XSLT_STOPFINDER_REQUEST?outputFormat=JSON&itdLPxx_usage=origin&useLocalityMainStop=true&doNotSearchForStops_sf=1&SpEncId=0&odvSugMacro=true&coordOutputFormat=WGS84&name_sf=";
var SASA_STOPS = "http://opensasa.info/SASAplandata/?type=REC_ORT"
var outputList = {};
var data;
var fd = fs.openSync("./outputSasa.json", "w");

request({url: SASA_STOPS,
  json: true,
  gzip: true,
  headers: {
    'Connection': 'keep-alive',
    'Accept-Encoding': 'gzip, deflate'
  }
},
function(err, res, body) {
  if(!err) {
    data = body;
    console.log(data);
    addTimeout(0);
  }
});

function addTimeout(i) {
  setTimeout(function () {
    forAll(data[i], i);
    if (i + 1 < data.length)
      addTimeout(i + 1);
  }, 500);
}

function forAll(el, index) {
  console.log("Lookup for " + el.ORT_NAME + " count " + index);
  busstopRequest(el.ORT_NAME + "&language=de");
  console.log("Lookup for " + el.ORT_NAME + " count " + index);
  busstopRequest(el.ORT_NAME + "&language=it");
  console.log("Lookup for " + el.ORT_NAME.split(" - ")[1] + " count " + index);
  busstopRequest(el.ORT_NAME.split(" - ")[1] + "&language=de");
  console.log("Lookup for " + el.ORT_NAME.split(" - ")[0] + " count " + index);
  busstopRequest(el.ORT_NAME.split(" - ")[0] + "&language=it");
}

function busstopRequest(query) {
  console.time("Request Time");
  request({url: BUSSTOP_QUERY + query,
    json: true,
    gzip: true,
    headers: {
      'Connection': 'keep-alive',
      'Accept-Encoding': 'gzip, deflate'
    }
  },
  function(err, res, body) {
    if(!err) {
      console.log("Got response");
      try {
        var busstopList = body.stopFinder.points;
        if (busstopList !== null) {
          if (busstopList.point !== undefined) {
            if (busstopList.point.anyType == "stop") {
              var stop = parseBusstop(busstopList.point);
              outputList[stop.id] = stop;
            }
          }
          else {
            for (var i = 0; i < busstopList.length; i++) {
              if (busstopList[i].anyType == "stop") {
                var stop = parseBusstop(busstopList[i]);
                outputList[stop.id] = stop;
              }
            }
          }
        }
      } catch (e) {
        console.error("JSON parse error:", e);
      }
    }
    else
      console.error("HTTP error:", err);
  });
}

function parseBusstop(el) {
  var res = {};
  res.name = el.name;
  res.city = el.mainLoc;
  res.object = el.object;
  res.ref = el.ref;
  //res.name = el.object;
  //res.city = el.posttown;
  res.id = el.stateless;
  return res;
}

var never = true;
process.on('beforeExit', function(event) {
  if (never) {
    fs.writeSync(fd, JSON.stringify(outputList));
    console.log("Save and exit");
    never = false;
  }
});
