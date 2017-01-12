/* global before, describe, it */

var assert = require("assert");
var fs = require("fs");

var handler = require("../handlers/formatElasticLoadBalancer");

describe('handler/formatElasticLoadBalancer.js', function() {
  describe('#process()', function() {
    var dataSource;
    var dataJson;

    before(function() {
      dataSource = JSON.parse(fs.readFileSync(
        "test/assets/elb.source.json"));
      dataJson = JSON.parse(fs.readFileSync(
        "test/assets/elb.format.json"));
    });

    it('should format parsed Elastic Load Balancer log data',
      function(done) {
        var config = {
          data: dataSource,
          dateField: 'timestamp',
          setting: true
        };
        handler.process(config)
          .then(function(result) {
            console.log("result.data is: " + JSON.stringify(result.data, null, 4));
            assert.ok(result.hasOwnProperty('setting'),
               'process returns config object');
            assert.deepStrictEqual(result.data, dataJson,
               'Elastic Load Balancer data formatted successfully');
            done();
          });
      });
  });
});
