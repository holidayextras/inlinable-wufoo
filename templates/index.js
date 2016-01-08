var fs = require('fs');
var path = require('path');
var template = require('lodash.template');

module.exports = {
  form: template(fs.readFileSync(path.resolve(__dirname, 'form.lodashtemplate'))),
  scripts: template(fs.readFileSync(path.resolve(__dirname, 'scripts.lodashtemplate')))
};
