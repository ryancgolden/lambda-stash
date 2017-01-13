// Modified from lambda-stash/handlers/formatCloudfront.js
// Requires corresponding parseSpaces.js file
// author: rgolden@modernize.com
'use strict';
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
      }

      // Some fields in the ELB logs are combined, so break them up into separate fields
      if ('client_port' in item) {
        var [clientIp, clientPort] = item.client_port.split(':');
        Object.assign(item, {
          "c-ip": clientIp,
          "c-port": clientPort
        });
      }

      if ('backend_port' in item) {
        var [backendIp, backendPort] = item.backend_port.split(':');
        Object.assign(item, {
          "s-ip": backendIp,
          "s-port": backendPort
        });
      }

      if ('request' in item) {
        // See test folder for example of what request rows look like
        var request;
        var method;
        var urlstr;
        var protoVer;
        var url;
        request = item.request.split(' ');
        method = request[0];
        urlstr = request[1];
        protoVer = request[2];
        url = parse(urlstr, true);

        Object.assign(item, {
          method: method,
          protocol: url.protocol.replace(':', ''),
          hostname: url.hostname,
          path: url.pathname,
          query: url.query,
          protocol_version: protoVer
        });
      }

      output.push(item);
    }
  }
  config.data = output;
  return Promise.resolve(config);
};
