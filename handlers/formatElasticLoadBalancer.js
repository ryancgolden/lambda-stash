// Modified from lambda-stash/handlers/formatCloudfront.js
// Requires corresponding parseSpaces.js file
// author: rgolden@modernize.com
var url = require('url');

exports.process = function(config) {
  // console.log('formatElasticLoadBalancer');
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
      }

      // Some fields in the ELB logs are combined, so break them up into separate fields
      if (item.hasOwnProperty('client_port')) {
        // This strips the port off of both IPv4 and IPv6 IPs
        var clientPortArr = item.client_port.split(':');
        var clientIp = clientPortArr.slice(0, (clientPortArr.length - 1))
            .join(':');
        var clientPort = clientPortArr[clientPortArr.length - 1];

        // ElasticSearch 5 won't accept empty string for IP data type
        clientIp = (clientIp) ? clientIp : '0.0.0.0';

        Object.assign(item, {
          "c-ip": clientIp,
          "c-port": clientPort
        });
      }

      if (item.hasOwnProperty('backend_port')) {
        var backendPortArr = item.backend_port.split(':');
        var backendIp = backendPortArr.slice(0, (backendPortArr.length - 1))
            .join(':');
        var backendPort = backendPortArr[backendPortArr.length - 1];

        // ElasticSearch 5 won't accept empty string for IP data type
        backendIp = (backendIp) ? backendIp : '0.0.0.0';

        Object.assign(item, {
          "s-ip": backendIp,
          "s-port": backendPort
        });
      }

      if (item.hasOwnProperty('request')) {
        // See test folder for example of what request rows look like
        var method;
        var urlstr;
        var protoVer;
        var myUrl;
        var requestArr = item.request.split(' ');
        method = requestArr[0];
        urlstr = requestArr[1].trim();
        protoVer = requestArr[2];
        myUrl = url.parse(urlstr, true);

        // For some reason url.parse sometimes returns a query object
        // with an empty string property, which ElasticSearch doesn't like
        delete myUrl.query[''];

        Object.assign(item, {
          method: method,
          protocol: myUrl.protocol.replace(':', ''),
          hostname: myUrl.hostname,
          path: myUrl.pathname,
          query: myUrl.query,
          protocol_version: protoVer
        });
      }

      output.push(item);
    }
  }
  config.data = output;
  return Promise.resolve(config);
};
