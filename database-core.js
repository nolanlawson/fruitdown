'use strict';

//
// Class that should contain everything necessary to interact
// with localStorage as a generic key-value store.
// The idea is that authors who want to create an AbstractKeyValueDOWN
// module (e.g. on lawnchair, S3, whatever) will only have to
// reimplement this file.
//

var callbackify = require('./callbackify');

function createPrefix(dbname) {
  return dbname.replace(/!/g, '!!') + '!'; // escape bangs in dbname;
}

function StorageCore(dbname) {
  this._prefix = createPrefix(dbname);
}

StorageCore.prototype.getKeys = function (callback) {
  var self = this;
  callbackify(callback, function () {
    var keys = [];
    var prefixLen = self._prefix.length;
    var i = -1;
    var len = window.localStorage.length;
    while (++i < len) {
      var fullKey = window.localStorage.key(i);
      if (fullKey.substring(0, prefixLen) === self._prefix) {
        keys.push(fullKey.substring(prefixLen));
      }
    }
    keys.sort();
    return keys;
  });
};

StorageCore.prototype.put = function (key, value, callback) {
  var self = this;
  callbackify(callback, function () {
    window.localStorage.setItem(self._prefix + key, value);
  });
};

StorageCore.prototype.get = function (key, callback) {
  var self = this;
  callbackify(callback, function () {
    return window.localStorage.getItem(self._prefix + key);
  });
};

StorageCore.prototype.remove = function (key, callback) {
  var self = this;
  callbackify(callback, function () {
    window.localStorage.removeItem(self._prefix + key);
  });
};

StorageCore.destroy = function (dbname, callback) {
  var prefix = createPrefix(dbname);
  callbackify(callback, function () {
    Object.keys(localStorage).forEach(function (key) {
      if (key.substring(0, prefix.length) === prefix) {
        localStorage.removeItem(key);
      }
    });
  });
};

module.exports = StorageCore;