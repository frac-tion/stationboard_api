var request = require("request");

//62.101.1.162 is efa.mobilitaetsagentur.bz.it
var BUSSTOP_QUERY = 'http://62.101.1.162/apb/XSLT_STOPFINDER_REQUEST?language=de&outputFormat=JSON&itdLPxx_usage=origin&useLocalityMainStop=true&doNotSearchForStops_sf=1&SpEncId=1&odvSugMacro=true&name_sf=';
var STATIONBOARD_QUERY = 'http://62.101.1.162/apb/XSLT_DM_REQUEST?language=de&deleteAssignedStops_dm=1&trITMOTvalue100=7&useProxFootSearch=0&itdLPxx_today=10&mode=direct&lsShowTrainsExplicit=0&type_dm=any&includedMeans=checkbox&inclMOT_ZUG=1&inclMOT_BUS=1&inclMOT_8=1&inclMOT_9=1&locationServerActive=1&convertStopsPTKernel2LocationServer=1&convertAddressesITKernel2LocationServer=1&convertCoord2LocationServer=1&convertCrossingsITKernel2LocationServer=1&convertPOIsITKernel2LocationServer=1&stateless=1&itOptionsActive=1&ptOptionsActive=1&itdLPxx_depOnly=1&maxAssignedStops=1&hideBannerInfo=1&execInst=normal&limit=15&useAllStops=1&outputFormat=JSON&name_dm=';

var queryList = ["Lana", "La", "B", "Bolzano"];
var sum = 0;
var result = 0;

	test(0, 0);

//BUSSTOP_QUERY = "http://golem.de?";
function test(i, j) {
	var date1 = new Date();
	request({url: BUSSTOP_QUERY + queryList[j],
	 	//json: true,
		headers: {
			'If-Modified-Since': 'Fri, 27 Mar 2015 17:39:02 GMT'}
	}, function(err, res, body) {
		var date2 = new Date();
		var date = (date2-date1);
		sum += date;	
		console.log(res.statusCode);
		console.log(res.headers);
		console.log(res.request.headers);
		console.log("Test: " + (i+1) + " with string: " + queryList[j] +
			 	"		Time: " + (date) + " ms");
		if (i < 9)
			test(i+1, j);
		else {
			result += (sum/(i+1));
			sum = 0;
			console.log("Result: " + parseInt(result/(j+1)) + " ms");
			if (j < queryList.length)
				test(0, j+1);
		}
	});
}

