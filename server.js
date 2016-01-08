'use strict';

var http = require('http');
var inlinableWufoo = require('./index');
var url = require('url');
var qs = require('querystring');

var server = http.createServer(function(req, res) {
  var urlData = url.parse(req.url);
  var params = {};

  if (urlData.query) {
    params = qs.parse(urlData.query);
  }

  if (!(params.account && params.form)) {
    return res.end('account and form url params required');
  }

  var additionalTransforms = [];
  if (params.bootstrapify) {
    additionalTransforms.push('bootstrapify');
  }

  inlinableWufoo.get(params.account, params.form, {
    additionalTransforms: additionalTransforms
  }, function(err, html) {
    if (err) {
      return res.end(err);
    }

    res.setHeader('Content-type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(html));
  });
});

var PORT = 9595;
server.listen(PORT, function() {
  console.log('Server listening on: http://localhost:%s', PORT);
});
