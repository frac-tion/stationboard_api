var fs = require('fs');
var geo = require('geolib');

var sasaFb = fs.openSync("./data/SASA_Ids.json", "r");
var efaFb = fs.openSync("./data/allStopsEFA.json", "r");

var sasaList = JSON.parse(fs.readFileSync(sasaFb, 'utf8'));
var efaList = JSON.parse(fs.readFileSync(efaFb, 'utf8'));

//console.log(sasaList);
//console.log(efaList);
//
sasaList.forEach(function (sasaStop) {
  // coords: { ORT_POS_BREITE: 46.45577, ORT_POS_LAENGE: 11.335249999999998 } 
  //latitude and longitude
  var bestMatch;
  var distance;
  var sasaLat = sasaStop.coords.ORT_POS_BREITE;
  var sasaLon = sasaStop.coords.ORT_POS_LAENGE;
  if (sasaStop.ORT_NAME == "Scuole Lana - Zollschule Lana")
    var debug = true;
  else
    var debug = false;
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



//'66008513': 
//   { de: { name: 'Martina', city: 'Tschlin' },
//          coords: '10464253.45025,46885752.27405',
//               it: { name: 'Martina', city: 'Tschlin' } 



function parseEfaCoords(coords) {
  var newCoords = {};
  //console.log(coords);
  coords = coords.split(",");
  //{latitude: 51.5103, longitude: 7.49347},
  newCoords.latitude = coords[1] / 1000000;
  newCoords.longitude = coords[0] / 1000000;
  return newCoords;
}

