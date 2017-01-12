// Modified from lambda-stash/handlers/formatCloudfront.js
// Requires corresponding parseSpaces.js file
// author: rgolden@modernize.com

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

    // In cloudfront logs a fields line is written, but not so in ELB logs
    // so this first clause should never run, but I'm leaving it in in case ELB
    // ever changes to the cloudfront technique
    // I've hard-coded the field names above
    if (numCols === 1) {
      row = row[0];
      var pos = row.indexOf('#Fields: ');
      if (pos !== -1) {
        row = row.substr(pos + 9);
        fields = row.split(" ");
      }
    } else if (numCols) {
      item = {};
      for (j = 0; j < numCols; j++) {
        label = (j < fields.length) ? fields[j] : String(j);
        item[label] = row[j];
      }

// I don't think we need this because the ELB field already uses
// a format like: 2017-01-06T17:10:59.793177Z
      // if (config.dateField) {
      //   if (config.dateField === 'date') {
      //     item.originalDate = item.date;
      //   }
      //   item[config.dateField] = item.date + 'T' + item.time;
      // }

      output.push(item);
    }
  }
  config.data = output;
  return Promise.resolve(config);
};
