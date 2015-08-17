var ws = new WebSocket('ws://192.168.12.136:8000');

ws.onopen = function (event) {
	ws.send(JSON.stringify({call:"busstopRequest", query:"stazione"}));
};

ws.onmessage = function(data, flags) {
	data = JSON.parse(data.data);
	console.log(data.cb);
	cbList[data.cb](data.res);
}

var cbList = {};
cbList.busstopResponse = function (data) {
	var html = '';
	for (var i = 0; i < data.length; i++)
		html += '<div>' + data[i].name + ', ' + data[i].city + '</div>';
	document.getElementById("container").innerHTML =  html;
}
cbList.stationboardResponse = function (data) {
	console.log("Result:", data);
}


document.getElementById("input").oninput = function () {
	var query = document.getElementById("input").value;
	console.log(query);
	ws.send(JSON.stringify({call:"busstopRequest", "query":query}));

}
