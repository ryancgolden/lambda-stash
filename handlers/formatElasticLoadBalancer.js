// Modified from lambda-stash/handlers/formatCloudfront.js
// Requires corresponding parseSpaces.js file
// author: rgolden@modernize.com
var parse = require('url-parse');

exports.process = function(config) {
  console.log('formatElasticLoadBalancer');
  var output = [];
  var fields = [
    "timestamp",
    "elb",
    "client_port",
    "backend_port",
    "request_processing_time",
    "backend_processing_time",
    "response_processing_time",
    "elb_status_code",
    "backend_status_code",
    "received_bytes",
    "sent_bytes",
    "request",
    "user_agent",
    "ssl_cipher",
    "ssl_protocol"
  ];
  var numRows = config.data.length;
  var numCols;
  var i;
  var j;
  var row;
  var item;
  var label;

  for (i = 0; i < numRows; i++) {
    row = config.data[i];
    numCols = row.length;

    if (numCols) {
      item = {};
      for (j = 0; j < numCols; j++) {
        label = (j < fields.length) ? fields[j] : String(j);
        item[label] = row[j];
      };

      // Some fields in the ELB logs are combined, so break them up into separate fields
      if ('client_port' in item) {
        var [client_ip, client_port] = item['client_port'].split(':');
        Object.assign(item, {
          "c-ip": client_ip,
          "c-port": client_port
        });
      };
      if ('backend_port' in item) {
        var [backend_ip, backend_port] = item['backend_port'].split(':');
        Object.assign(item, {
          "s-ip": backend_ip,
          "s-port": backend_port
        });
      };
      if ('request' in item) {
        // Requests look like: "GET http://lm.hilprod.com:80/lead/formpostlead?TYPE=1&Project=Heating+and+Cooling+Installation&Ip=174.193.150.164&LandingPage=https%3A%2F%2Fmodernize.com%2Fquotes%2Fhvac-heat-pump-installation&Src=Source78&FirstName=Barbara&LastName=Kinard&Email=bkinard7%40ymail.com&Address=2220+hertford+dr&Zip=29210&HomePhone=8037726933&WorkPhone=&CellPhone=&SubId=82153&PubId=&Homeowner=Yes&parm1=Yes&parm2=Yes&Repair=No&HvacSystemType=Heat+Pump&GlassOnly=No&UserSessionId=75002626&LeadId=-8450106&tcpa=Yes&tcpaText=By+submitting+this+request%2C+you+authorize+Modernize+and+up+to+four+home+service+companies+that+can+help+with+your+project+to+call+or+text+you+on+the+phone+number+provided+using+autodialed+and+prerecorded+calls+or+messages.+Your+consent+to+this+agreement+is+not+required+to+purchase+products+or+services.+We+respect+your+privacy.&Mode=full HTTP/1.1"
         var request, method, urlstr, proto_ver, url; 
         request = item['request'].split(' ');
         method = request[0];
         urlstr = request[1];
         proto_ver = request[2];
         url = parse(urlstr, true);

        Object.assign(item, {
          method : method,
          protocol : url.protocol.replace(':', ''),
          hostname: url.hostname,
          path: url.pathname,
          query: url.query,
          protocol_version: proto_ver
        });
      }

      output.push(item);
    }
  }
  config.data = output;
  return Promise.resolve(config);
};
