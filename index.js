'use strict';

var request = require('superagent');
var cheerio = require('cheerio');
var templates = require('./templates');
var transforms = require('./lib/transforms');

var inlinableWufoo = module.exports = {};

inlinableWufoo.get = function(account, formName, options, callback) {
  if (!callback) {
    callback = options;
  }

  inlinableWufoo.loadFormHtml(account, formName, function(err, responseText) {
    if (err) return callback(err);

    return callback(null, inlinableWufoo.transform(responseText, formName, options));
  });
};

inlinableWufoo.loadFormHtml = function(account, formName, callback) {
  request
    .get('https://' + account + '.wufoo.eu/embed/' + formName + '/')
    .end(function(err, res) {
      if (err) return callback(err);

      callback(null, res.text);
    });
};

inlinableWufoo.transform = function(html, formName, options) {
  options = options || {};

  var submitFunctionName = options.submitFunctionName || ('wh-submit-' + formName);

  var $ = cheerio.load(html);
  var $container = cheerio.load($('#container').html());
  $container = transforms.removeUnnecessaryElements($container);

  var $fields = transforms.extractFields($container, formName);
  var $form = transforms.extractEmptyForm($container, formName);
  var encodedForm = new Buffer(transforms.wrapForm($form, formName), 'utf8').toString('base64');

  if (options.additionalTransforms) {
    if (!Array.isArray(options.additionalTransforms)) {
      console.error('additionalTransforms must be an array');
    } else {
      $fields = options.additionalTransforms.reduce(function($currentFields, transformName) {
        if (!transforms[transformName]) {
          console.error(transformName + ' is not a supported transform');
          return $currentFields;
        }

        return transforms[transformName]($fields, formName);
      }, $fields);
    }
  }

  var scripts = templates.scripts({
    fnName: submitFunctionName,
    locator: formName,
    base64FormHtml: encodedForm
  });

  return {
    html: $fields.html() + scripts,
    submitFunctionName: submitFunctionName
  };
};
