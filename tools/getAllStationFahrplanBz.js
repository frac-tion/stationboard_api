
var soap = require('soap');
var url = 'http://timetables.sad.it/SIITimetablesMobile.php?wsdl';
var args = {searchstring: '*'};
soap.createClient(url, function(err, client) {
  client.searchNodo(args, function(err, result) {
    console.log(JSON.stringify(result));
  });
});
