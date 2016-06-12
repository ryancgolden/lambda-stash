var parse = require('csv-parse');

exports.process = function(config) {
  console.log('parseTabs::process');
  return new Promise(function(resolve, reject) {
    parse(config.data, {
      delimiter: '\t',
      relax_column_count: true,
      trim: true
    }, function(err, data) {
      if (err) {
        return reject(err);
      }
      config.data = data;
      resolve(config);
    });
  });
};
