'use strict';

var arrayBuffPrefix = 'ArrayBuffer:';
var arrayBuffRegex = new RegExp('^' + arrayBuffPrefix);
var uintPrefix = 'Uint8Array:';
var uintRegex = new RegExp('^' + uintPrefix);

var utils = require('./utils');
var LocalStorageCore = require('./localstorage-core');
var TaskQueue = require('./taskqueue');

function LocalStorage(dbname) {
  this._store = new LocalStorageCore(dbname);
  this._queue = new TaskQueue();
}

LocalStorage.prototype.sequentialize = function (callback, fun) {
  this._queue.add(fun, callback);
};

LocalStorage.prototype.init = function (callback) {
  var self = this;
  self.sequentialize(callback, function (callback) {
    self._store.getKeys(function (err, keys) {
      if (err) {
        return callback(err);
      }
      self._keys = keys;
      return callback();
    });
  });
};

// returns the key index if found, else the index where
// the key should be inserted. also returns the key
// at that index
LocalStorage.prototype.binarySearch = function (key, callback) {
  var self = this;
  self.sequentialize(callback, function (callback) {
    var index = utils.sortedIndexOf(self._keys, key);
    var foundKey = (index >= self._keys.length || index < 0) ?
        undefined : self._keys[index];
    callback(null, {index: index, key: foundKey});
  });
};

LocalStorage.prototype.getKeyAt = function (index, callback) {
  var self = this;
  self.sequentialize(callback, function (callback) {
    var foundKey = (index >= self._keys.length || index < 0) ?
      undefined : self._keys[index];
    callback(null, foundKey);
  });
};

//setItem: Saves and item at the key provided.
LocalStorage.prototype.setItem = function (key, value, callback) {
  var self = this;
  self.sequentialize(callback, function (callback) {
    if (value instanceof ArrayBuffer) {
      value = arrayBuffPrefix + btoa(String.fromCharCode.apply(null, value));
    } else if (value instanceof Uint8Array) {
      value = uintPrefix + btoa(String.fromCharCode.apply(null, value));
    }

    var idx = utils.sortedIndexOf(self._keys, key);
    if (self._keys[idx] !== key) {
      self._keys.splice(idx, 0, key);
    }
    self._store.put(key, value, callback);
  });
};

//getItem: Returns the item identified by it's key.
LocalStorage.prototype.getItem = function (key, callback) {
  var self = this;
  self.sequentialize(callback, function (callback) {
    self._store.get(key, function (err, retval) {
      if (err) {
        return callback(err);
      }
      if (typeof retval === 'undefined' || retval === null) {
        // 'NotFound' error, consistent with LevelDOWN API
        return callback(new Error('NotFound'));
      }
      if (typeof retval !== 'undefined') {
        if (arrayBuffRegex.test(retval)) {
          retval = retval.substring(arrayBuffPrefix.length);
          retval = new ArrayBuffer(atob(retval).split('').map(function (c) {
            return c.charCodeAt(0);
          }));
        } else if (uintRegex.test(retval)) {
          retval = retval.substring(uintPrefix.length);
          retval = new Uint8Array(atob(retval).split('').map(function (c) {
            return c.charCodeAt(0);
          }));
        }
      }
      callback(null, retval);
    });
  });
};

//removeItem: Removes the item identified by it's key.
LocalStorage.prototype.removeItem = function (key, callback) {
  var self = this;
  self.sequentialize(callback, function (callback) {
    var idx = utils.sortedIndexOf(self._keys, key);
    if (self._keys[idx] === key) {
      self._keys.splice(idx, 1);
      self._store.remove(key, function (err) {
        if (err) {
          return callback(err);
        }
        callback();
      });
    } else {
      callback();
    }
  });
};

LocalStorage.prototype.length = function (callback) {
  var self = this;
  self.sequentialize(callback, function (callback) {
    callback(null, self._keys.length);
  });
};

exports.LocalStorage = LocalStorage;
