var fs = require('fs');

var fb = fs.openSync('../data/allStopsEFA.json', 'r');
var data  = JSON.parse(fs.readFileSync(fb, 'utf8')).pins;
console.log(data);

var count = 0;
for (i in data) {
  count++;
}

console.log(count);


