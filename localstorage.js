'use strict';

var arrayBuffPrefix = 'ArrayBuffer:';
var arrayBuffRegex = new RegExp('^' + arrayBuffPrefix);
var uintPrefix = 'Uint8Array:';
var uintRegex = new RegExp('^' + uintPrefix);

var utils = require('./utils');

function LocalStorage(dbname) {
  this._keys = [];
  this._prefix = dbname + '!';

  var prefixLen = this._prefix.length;
  var i = -1;
  var len = window.localStorage.length;
  while (++i < len) {
    var fullKey = window.localStorage.key(i);
    if (fullKey.substring(0, prefixLen) === this._prefix) {
      this._keys.push(fullKey.substring(prefixLen));
    }
  }
  this._keys.sort();
}

//key: Returns the name of the key at the position specified.
LocalStorage.prototype.key = function (keyindex) {
  return this._keys[keyindex];
};

// returns the key index if found, else the index where
// the key should be inserted
LocalStorage.prototype.indexOfKey = function(key) {
  return utils.sortedIndexOf(this._keys, key);
};

//setItem: Saves and item at the key provided.
LocalStorage.prototype.setItem = function (key, value) {
  if (value instanceof ArrayBuffer) {
    value = arrayBuffPrefix + btoa(String.fromCharCode.apply(null, value));
  } else if (value instanceof Uint8Array) {
    value = uintPrefix + btoa(String.fromCharCode.apply(null, value));
  }

  var idx = utils.sortedIndexOf(this._keys, key);
  if (this._keys[idx] !== key) {
    this._keys.splice(idx, 0, key);
  }
  window.localStorage.setItem(this._prefix + key, value);
};

//getItem: Returns the item identified by it's key.
LocalStorage.prototype.getItem = function (key) {
  var value;

  var retval = window.localStorage.getItem(this._prefix + key);
  if (retval == null) {
    return undefined;
  }

  if (arrayBuffRegex.test(retval)) {
    value = retval.substring(arrayBuffPrefix.length);
    retval = new ArrayBuffer(atob(value).split('').map(function (c) {
      return c.charCodeAt(0);
    }));
    return retval;
  } else if (uintRegex.test(retval)) {
    value = retval.substring(uintPrefix.length);
    retval = new Uint8Array(atob(value).split('').map(function (c) {
      return c.charCodeAt(0);
    }));
    return retval;
  }
  return retval;
};

//removeItem: Removes the item identified by it's key.
LocalStorage.prototype.removeItem = function (key) {

  var idx = utils.sortedIndexOf(this._keys, key);
  if (this._keys[idx] === key) {
    this._keys.splice(idx, 1);
    window.localStorage.removeItem(this._prefix + key);
  }
};

LocalStorage.prototype.length = function () {
  return this._keys.length;
};

exports.LocalStorage = LocalStorage;
