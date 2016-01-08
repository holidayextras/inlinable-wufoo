var expect = require('chai').use(require('dirty-chai')).use(require('sinon-chai')).expect;
var sinon = require('sinon');
var request = require('superagent');
var cheerio = require('cheerio');
var inlinableWufoo = require('../');
var transforms = require('../lib/transforms');
var templates = require('../templates');

describe('inlinableWufoo', function() {
  describe('get', function() {
    beforeEach(function() {
      sinon.stub(inlinableWufoo, 'loadFormHtml');
      sinon.stub(inlinableWufoo, 'transform');
    });

    afterEach(function() {
      inlinableWufoo.loadFormHtml.restore();
      inlinableWufoo.transform.restore();
    });

    it('loads the form html then transforms it', function(done) {
      inlinableWufoo.loadFormHtml.yields(null, 'some html');
      inlinableWufoo.transform.returns('the result');

      inlinableWufoo.get('account', 'form name', function(err, result) {
        expect(inlinableWufoo.loadFormHtml).to.have.been.calledWith('account', 'form name', sinon.match.func);
        expect(inlinableWufoo.transform).to.have.been.calledWith('some html', 'form name');

        expect(err).to.not.be.ok();
        expect(result).to.equal('the result');

        done();
      });
    });

    it('can pass options to transform', function(done) {
      var options = { a: 'bv' };
      inlinableWufoo.loadFormHtml.yields(null, 'some html');

      inlinableWufoo.get('account', 'form name', options, function(err, result) {
        expect(inlinableWufoo.transform).to.have.been.calledWith('some html', 'form name', options);

        done();
      });
    });

    it('errbacks if loadFormHtml errbacks', function(done) {
      inlinableWufoo.loadFormHtml.yields('err!');

      inlinableWufoo.get('account', 'form name', function(err, result) {
        expect(err).to.equal('err!');
        done();
      });
    });
  });

  describe('loadFormHtml', function() {
    beforeEach(function() {
      sinon.spy(request, 'get');
      sinon.stub(request.Request.prototype, 'end');
    });

    afterEach(function() {
      request.get.restore();
      request.Request.prototype.end.restore();
    });

    it('loads a form url using superagent', function(done) {
      request.Request.prototype.end.yields(null, {
        text: 'the html'
      });

      inlinableWufoo.loadFormHtml('account', 'form name', function(err, result) {
        expect(err).not.to.be.ok();
        expect(result).to.equal('the html');

        expect(request.get).to.have.been.calledWith('https://account.wufoo.eu/embed/form name/');
        done();
      });
    });

    it('errbacks if request errbacks', function(done) {
      request.Request.prototype.end.yields('404');

      inlinableWufoo.loadFormHtml('account', 'form name', function(err, result) {
        expect(err).to.equal('404');
        done();
      });
    });
  });

  describe('transform', function() {
    var sandbox = sinon.sandbox.create();

    var theHtml = '<div class="theHtml"></div>';
    var theContainerHtml = '<div class="theContainer"></div>';
    var theContainer = '<div class="container"></div>';
    var theDocument = sinon.stub().returns({
      html: sinon.stub().returns(theContainerHtml)
    });
    var theContainerWithFieldsRemoved = '<div class="elementsRemoved"></div>';
    var theExtractedFieldHtml = '<div class="fieldsExtracted"></div>';
    var theExtractedFields = {
      html: sinon.stub().returns(theExtractedFieldHtml)
    };
    var theEmptyForm = '<form />';
    var theWrappedForm = '<div><form /><iframe /></div>';
    var theRenderedScriptTemplate = '<script />';

    beforeEach(function() {
      sandbox.stub(transforms, 'removeUnnecessaryElements').returns(theContainerWithFieldsRemoved);
      sandbox.stub(transforms, 'extractFields').returns(theExtractedFields);
      sandbox.stub(transforms, 'extractEmptyForm').returns(theEmptyForm);
      sandbox.stub(transforms, 'wrapForm').returns(theWrappedForm);
      sandbox.stub(transforms, 'bootstrapify').returns({
        html: sinon.stub().returns('bootstrap')
      });
      sandbox.stub(templates, 'scripts').returns(theRenderedScriptTemplate);
      sandbox.stub(cheerio, 'load')
        .withArgs(theHtml).returns(theDocument)
        .withArgs(theContainerHtml).returns(theContainer);
      sandbox.stub(console, 'error');
    });

    afterEach(function() {
      sandbox.restore();
    });

    it('passes a html string into cheerio then through several transformations', function() {
      var transformed = inlinableWufoo.transform(theHtml, 'form-name');

      expect(transformed).to.deep.equal({
        html: theExtractedFieldHtml + theRenderedScriptTemplate,
        submitFunctionName: 'wh-submit-form-name'
      });

      expect(transforms.removeUnnecessaryElements).to.have.been.calledWith(theContainer);
      expect(transforms.extractFields).to.have.been.calledWith(theContainerWithFieldsRemoved, 'form-name');
      expect(transforms.extractEmptyForm).to.have.been.calledWith(theContainerWithFieldsRemoved, 'form-name');
      expect(transforms.wrapForm).to.have.been.calledWith(theEmptyForm, 'form-name');
      expect(templates.scripts).to.have.been.calledWith({
        fnName: 'wh-submit-form-name',
        locator: 'form-name',
        base64FormHtml: new Buffer(theWrappedForm, 'utf8').toString('base64')
      });
    });

    it('can call additional transformations if required', function() {
      var transformed = inlinableWufoo.transform(theHtml, 'form-name', {
        additionalTransforms: [ 'bootstrapify' ]
      });

      expect(transformed).to.deep.equal({
        html: 'bootstrap' + theRenderedScriptTemplate,
        submitFunctionName: 'wh-submit-form-name'
      });
    });

    it('does not break if passed bad transformations', function() {
      expect(function() {
        var transformed = inlinableWufoo.transform(theHtml, 'form-name', {
          additionalTransforms: [ 'dfsnfdbkjkjbsdfbkjfsd' ]
        });
      }).not.to.throw(Error);
      expect(console.error).to.have.been.calledWith('dfsnfdbkjkjbsdfbkjfsd is not a supported transform');
    });
  });
});
