var expect = require('chai').use(require('dirty-chai')).expect;
var cheerio = require('cheerio');
var transforms = require('../lib/transforms');

describe('inlinableWufoo html transforms', function() {
  describe('removeUnnecessaryElements', function() {
    it('deletes some elements from the passed-in cheerio instance', function() {
      var html = cheerio.load('<div><header>a header</header><h1>a h1</h1><ul><li>a li</li><li class="buttons">the buttons</li></ul><div>etc</div></div>');
      var transformed = transforms.removeUnnecessaryElements(html);

      expect(transformed.html()).to.equal('<div><ul><li>a li</li></ul><div>etc</div></div>');
    });
  });;

  describe('extractFields', function() {
    it('gets the <ul> from the passed-in html and attaches an id', function() {
      var html = cheerio.load('<div><form><ul><li>a field</li></ul></form></div>');
      var transformed = transforms.extractFields(html, 'foo');

      expect(transformed.html()).to.equal('<ul id="wh-source-foo"><li>a field</li></ul>');
    });
  });

  describe('extractEmptyForm', function() {
    it('gets an empty <form> tag with its current attributes (and more)', function() {
      var html = cheerio.load('<div><form class="a b c" action="http://foo.com"><input /><span>aa</span></form></div>');
      var transformed = transforms.extractEmptyForm(html, 'foo');

      expect(transformed.is('form.a')).to.be.true();
      expect(transformed.is('form.b')).to.be.true();
      expect(transformed.is('form.c')).to.be.true();
      expect(transformed.attr('action')).to.equal('http://foo.com');

      expect(transformed.attr('target')).to.equal('wh-submit-to-foo');
      expect(transformed.attr('id')).to.equal('wh-target-foo');

      expect(transformed.children().length).to.equal(0);
    });
  });

  describe('wrapForm', function() {
    it('injects the passed-in elements into a hidden div next to an iframe', function() {
      var html = cheerio.load('<form action="http://a"></form>')('form');
      var transformed = transforms.wrapForm(html, 'foo');

      expect(transformed).to.equal('<div id="wh-container-foo" style="display:none;">\n  <form action="http://a"></form>\n  <iframe name="wh-submit-to-foo"></iframe>\n</div>\n');
    });
  });

  describe('bootstrapify', function() {
    it('can make some html more bootstrap-y', function() {
      var html = cheerio.load('<ul id="my-id"><li><label for="field1">transformable field name</label><div><input name="field1" /></div></li></ul>').root();
      var transformed = transforms.bootstrapify(html, 'foo');

      expect(transformed.html()).to.equal('<div id="my-id"><div class="form-group"><label for="field1" class="control-label col-md-4">transformable field name</label><div class="col-md-3"><div><input name="field1" class="form-control"></div></div></div></div>');
    });

    it('ignores hidden fields', function() {
      var html = cheerio.load('<ul id="my-id"><li class="hide"><label for="field1">invisible field name</label><div><input name="field1" /></div></li></ul>').root();
      var transformed = transforms.bootstrapify(html, 'foo');

      expect(transformed.html()).to.equal('<div id="my-id"><li class="hide"><label for="field1">invisible field name</label><div><input name="field1"></div></li></div>');
    });

    it('ignores fields withh many labels', function() {
      var html = cheerio.load('<ul id="my-id"><li><label for="field1">is this the label?</label><label for="field2">or is this?</label><div><input name="field1" /></div></li></ul>').root();
      var transformed = transforms.bootstrapify(html, 'foo');

      expect(transformed.html()).to.equal('<div id="my-id"><li><label for="field1">is this the label?</label><label for="field2">or is this?</label><div><input name="field1"></div></li></div>');
    });
  });
});
