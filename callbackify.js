'use strict';

// see http://stackoverflow.com/a/15349865/680742
var nextTick = global.setImmediate || process.nextTick;

module.exports = function callbackify(callback, fun) {
  var val;
  var err;
  try {
    val = fun();
  } catch (e) {
    err = e;
  }
  nextTick(function () {
    callback(err, val);
  });
};