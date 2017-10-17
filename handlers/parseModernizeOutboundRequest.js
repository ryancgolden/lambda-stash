var ParseException = message => {
  this.message = message;
  this.name = 'UserException';
};

exports.process = function(config) {
  console.log('parseModernizeOutboundRequest');
  try {
    if (!config.data.isArray()) {
      throw new ParseException('Data not in expected array form');
    }

    config.data.map(function(element) {
      var newElem = element;

      if (element.hasOwnProperty('requestBody')) {
        try {
          let bodyJson = JSON.parse(element.requestBody);
          newElem = Object.assign(newElem, {requestBodyJson: bodyJson});
          console.log('Found and converted JSON request body');
        } catch (err) { /* don't add property if not valid JSON */ }
      }

      if (element.hasOwnProperty('responseBody')) {
        try {
          let bodyJson = JSON.parse(element.responseBody);
          newElem = Object.assign(newElem, {responseBodyJson: bodyJson});
          console.log('Found and converted JSON response body');
        } catch (err) { /* don't add property if not valid JSON */ }
      }

      return newElem;
    });
  } catch (err) {
    return Promise.reject('Unable to parse Modernize outbound request: ' + err);
  }
  return Promise.resolve(config);
};
