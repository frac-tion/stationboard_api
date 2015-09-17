var WebSocket = require('ws');
var ws = new WebSocket('ws://localhost:8000');

ws.on('open', function open() {
	//ws.send(JSON.stringify({call:"busstopRequest", query:"lana"}));
	//ws.send(JSON.stringify({call:"stationboardRequest", query:"66002351"}));
	ws.send(JSON.stringify({call:"busstopRequest", query:"stazione"}));
});

ws.on('message', function(data, flags) {
	data = JSON.parse(data);
	console.log(data.cb);
	cbList[data.cb](data.res);
});

var cbList = {};
cbList.busstopResponse = function (data) {
	console.log("Result:", data);
}
cbList.stationboardResponse = function (data) {
	console.log("Result:", data);
}
module.exports = ws;
