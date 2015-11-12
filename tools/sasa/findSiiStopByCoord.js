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
    efaList[bestMatch].sasa = saveIds(sasaStop.busstops);

});

console.log(JSON.stringify(efaList));

//Create an array of the busstops ids
function saveIds(stops) {
  var stopArr = [];
  stops.forEach(function(stop) {
    stopArr.push(stop.ORT_NR);
  });
  return stopArr;
}


/*{
  "ORT_NAME": "Aspmair - Aspmair",
  "ORT_GEMEINDE": "Avelengo - Hafling",
  "busstops": [
  {
  "ORT_NR": 9761,
  "ORT_POS_BREITE": 46.63494,
  "ORT_POS_LAENGE": 11.21741
  },
  {
  "ORT_NR": 9762,
  "ORT_POS_BREITE": 46.63501,
  "ORT_POS_LAENGE": 11.21733
  }
  ],
  "coords": {
  "ORT_POS_BREITE": 46.634975,
  "ORT_POS_LAENGE": 11.217369999999999
  }
  },

*/
