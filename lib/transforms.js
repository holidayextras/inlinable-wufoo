'use strict';

var cheerio = require('cheerio');
var templates = require('../templates');

var transforms = module.exports = {};

// Remove any elements from the embed code that are
// surplus to requirements.
transforms.removeUnnecessaryElements = function($container) {
  $container('header, h1').remove();
  $container('li.buttons').remove();
  return $container;
};

// Get the contents of the <form> element, so they can be
// written into an existing <form>.
transforms.extractFields = function($container, locator) {
  var $fields = $container('form > ul').parent();
  $fields.find('ul').attr('id', 'wh-source-' + locator);
  return $fields;
};

// Get the <form> element, without its contents.
// We'll need it to submit the data supplied to where
// the embed originally intended it to go.
transforms.extractEmptyForm = function($container, locator) {
  var $form = $container('form').clone();
  $form.children().remove();
  $form.attr('target', 'wh-submit-to-' + locator);
  $form.attr('id', 'wh-target-' + locator);
  return $form;
};

// Wrap the form in a container which ensures it's invisible,
// and that it has an invisible iframe to be submitted into.
// This will let the page you embed this form inside to behave
// the same way it currently does.
transforms.wrapForm = function($form, locator) {
  // .html() returns the _inner_ HTML of an element, so we need to
  // append the form to _something_ in order to get the <form> tag
  // and its attributes.
  var $tmp = cheerio.load('<div></div>');
  $tmp('div').append($form);

  var formContainerHtml = templates.form({
    locator: locator,
    formHtml: $form.parent().html()
  });

  return formContainerHtml;
};

// Make the markup more "bootstrap-y", where it does not
// involve too much trouble
transforms.bootstrapify = function($fields) {
  var id = $fields.find('ul').attr('id');
  var $container = cheerio.load('<div id="' + id + '"></div>');

  $fields.find('li').each(function(i, n) {
    var $primaryDiv = $container.root().find('#' + id);

    var $n = cheerio.load(n);
    if ($n.root().find('li').is('.hide')) {
      $primaryDiv.append($n.html());
      return;
    }

    var $div = cheerio.load('<div class="form-group"></div>');
    var $label = $n.root().find('label');
    if ($label.length !== 1) {
      $primaryDiv.append($n.html());
      return;
    }

    $label.addClass('control-label col-md-4');
    var $inputContainer = $n.root().find('div');
    $inputContainer.find(':input').addClass('form-control');

    $div('.form-group').append($label)
      .append('<div class="col-md-3"></div>')
      .find('.col-md-3')
      .append($inputContainer);

    $primaryDiv.append($div.html());
  });

  return $container;
};
