var request = require("request");

request("http://opensasa.info/SASAplandata/?type=REC_ORT", function (err, res, body) {
  body = JSON.parse(body);
  body.forEach(function (el) {
    var lat = 0;
    var longCoords = 0;
    el.busstops.forEach(function (stop) {
      lat += stop.ORT_POS_BREITE;
      longCoords += stop.ORT_POS_LAENGE;
    });
    el.coords = {};
    el.coords.ORT_POS_BREITE = lat / el.busstops.length;
    el.coords.ORT_POS_LAENGE = longCoords / el.busstops.length;

    
/*    { ORT_NR: 972,
          ORT_POS_BREITE: 46.62519,
              ORT_POS_LAENGE: 11.14775 } ]
              */
  });
  console.log(body);
});

