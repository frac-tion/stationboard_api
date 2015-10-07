var ws = new WebSocket('ws://127.0.0.1:8000');
//var ws = new WebSocket('ws://sparber.net:62249');

ws.onopen = function (event) {
	//ws.send(JSON.stringify({call:"busstopRequest", query:"stazione"}));
	document.getElementById("input").oninput = function () {
		var query = document.getElementById("input").value;
		console.log(query);
		ws.send(JSON.stringify({call:"busstopRequest", "query":query}));
	}
};

ws.onmessage = function(data, flags) {
	data = JSON.parse(data.data);
	cbList[data.cb](data.res);
}

var cbList = {};
cbList.busstopResponse = function (data) {
	var html = '';
	for (var i = 0; i < data.length; i++)
		html += '<div style="cursor: pointer;" onclick="loadBoard(' + data[i].id + ')">' + data[i].name + ', ' + data[i].city + '</div>';
	document.getElementById("container").innerHTML =  html;
}

cbList.stationboardResponse = function (data) {
	console.log("Result:", data);
	var html = '';
	for (var i = 0; i < data.length; i++)
		html += '<div>' +
			data[i].number + ', ' + data[i].destination + 
			' at ' + 
			data[i].departure + ' with a delay of ' + data[i].delay + '</div>';
	document.getElementById("container").innerHTML =  html;
}


function loadBoard(id) {
	console.log("Request board for: " + id);
	ws.send(JSON.stringify({call:"stationboardRequest", query:id}));
}
