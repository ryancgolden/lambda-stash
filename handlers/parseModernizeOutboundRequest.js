'use strict';

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
          newElem = Object.assign(newElem, {requestBody: bodyJson});
          console.log('Found and converted JSON request body');
        } catch (err) {
          // If not JSON, then encapsulate it in an object
          newElem = Object.assign(newElem, {
            requestBody: {
              body: element.requestBody
            }
          });
          console.log('Found and converted string request body');
        }
      }

      if (element.hasOwnProperty('responseBody')) {
        try {
          let bodyJson = JSON.parse(element.responseBody);
          newElem = Object.assign(newElem, {responseBody: bodyJson});
          console.log('Found and converted JSON response body');
        } catch (err) {
          // If not JSON, then encapsulate it in an object
          newElem = Object.assign(newElem, {
            responseBody: {
              body: element.responseBody
            }
          });
          console.log('Found and converted string response body');
        }
      }

      return newElem;
    });
  } catch (err) {
    return Promise.reject('Unable to parse Modernize outbound request: ' + err);
  }
  return Promise.resolve(config);
};
