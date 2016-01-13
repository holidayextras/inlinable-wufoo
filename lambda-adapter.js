var lambdaAdapter = module.exports = {};
var inlinableWufoo = require('./');

lambdaAdapter.handler = function(event, context) {
  console.log('Event=', JSON.stringify(event, null, 2));

  inlinableWufoo.get(event.account, event.form, {
    additionalTransforms: [ 'bootstrapify' ]
  }, function(err, result) {
    if (err) return context.fail(err);

    context.succeed(result);
  });
};
