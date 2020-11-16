/*
Modeled after formatCloudWatchLogs
Use in place of formatCloudWatchLogs for API Gateway request logging
Assumes inpute from parseJson handler
Output suitable for input to shipElasticsearch handler
*/
'use strict';

var _ = require('lodash');

const DELIMITERS = {
  'api-gateway': {
    START: /Verifying Usage Plan/,
    END: /Method completed with/
  }
};

const SERVICE_REGEX = {
  'api-gateway': {
    // ts_start: /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z){1}/,
    // ts_end: /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z){1} Method completed/,
    backend_latency: /Received response. Status: \d+, Integration latency: (\d+) ms/,
    method: /HTTP Method: (.*?),/,
    request_id: /request: (.{36})/,
    request_uri: /Endpoint request URI: (.*?)(?:\s|$)/,
    request_path: /request path: {(.*)}/,
    resource_path: /Resource Path: (.*)/,
    request_query_string: /request query string: {(.*)}/,
    request_headers: /Method request headers: (.*?)(?:\n|"|$)/,
    request_body: /Method request body before transformations: (.*)/,
    response_status: /completed with status: (\d{3})/,
    response_headers: /Endpoint response headers: (.*)/,
    response_body: /Method response body after transformations:([\s\S]*?)\(.{36}\)/,
    api_method_path: /because method '(.*?)'/,
    api_key: /API Key: (.*?) API Stage/,
    api_stage: /API Stage: (.*?)(?:\s|$)/
  }
};

var processEvent = (service, txt) => {
  let res = {};
  let regex = SERVICE_REGEX[service];

  for (let expr of Object.keys(regex)) {
    let match = regex[expr].exec(txt);

    if (match && match.length > 1) {
      if (isNaN(match[1])) {
        res[expr] = match[1];
      } else {
        res[expr] = parseInt(match[1], 10);
      }
    } else {
      res[expr] = null;
    }
  }
  return res;
//  return Object.assign(res, {raw: txt});
};

var isStart = (service, line) => {
  return DELIMITERS[service].START.test(line);
};

var isEnd = (service, line) => {
  return DELIMITERS[service].END.test(line);
};

var parselogs = (service, logLines, eventMetadata) => {
  eventMetadata = eventMetadata || {};

  let reducer = (memo, currentLine) => {
    if (isStart(service, currentLine)) {
      memo.current = [];
    }

    memo.current.push(currentLine.trim());

    if (isEnd(service, currentLine)) {
      let txt = memo.current.join('\n');
      memo.events.push(processEvent(service, txt));
    }
    return memo;
  };

  logLines = logLines.reduce(reducer, {current: [], events: []});

  return logLines.events.map(e => Object.assign(e, eventMetadata));
};

exports.process = function(config) {
  // console.log('formatApiGatewayLogs');
  if (!config.data ||
      !config.data.hasOwnProperty('logEvents') ||
      _.isNil(config.data.logEvents.length)) {
    return Promise.reject('Received unexpected AWS Cloudwatch Logs format:' +
      JSON.stringify(config.data));
  }

  // collapse messages into single string
  var logLines = [];
  var time = '';
  config.data.logEvents.forEach(function(element) {
    logLines.push(element.message);
    time = element.timestamp;  // just keep the last time  FIXME
  });

  // run simple parse
  time = new Date(time).toISOString();
  config.data = parselogs('api-gateway', logLines, {timestamp: time});

  return Promise.resolve(config);
};
