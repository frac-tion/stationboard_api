var fs = require('fs');
var geo = require('geolib');

var sasaFb = fs.openSync("./data/SASA_Ids.json", "r");
var efaFb = fs.openSync("./data/allStopsEFA.json", "r");

var sasaList = JSON.parse(fs.readFileSync(sasaFb, 'utf8'));
var efaList = JSON.parse(fs.readFileSync(efaFb, 'utf8'));

sasaList.forEach(function (sasaStop) {
  //latitude and longitude
  // coords: { ORT_POS_BREITE: 46.45577, ORT_POS_LAENGE: 11.335249999999998 } 
  var bestMatch;
  var distance;
  var sasaLat = sasaStop.coords.ORT_POS_BREITE;
  var sasaLon = sasaStop.coords.ORT_POS_LAENGE;

  for (efaStop in efaList) {
    efaCoords = efaList[efaStop].coords;

    var newDistance = geo.getDistance({latitude: sasaLat, longitude: sasaLon}, efaCoords);
    //found better match
    if ((newDistance < distance) || (distance === undefined)) {
      distance = newDistance;
      bestMatch = efaStop;
    }
  }
  if (bestMatch !== undefined)
    efaList[bestMatch].sasa = sasaStop.ORT_NAME;

});

console.log(JSON.stringify(efaList));
