'use strict';

var utils = require('./utils');

function LocalStorage(dbname) {
  this._partition = dbname;
  this._keys = [];

  for (var i = 0; i < window.localStorage.length; i++) {
    if (window.localStorage.key(i).indexOf(dbname + '!') === 0) {
      this._keys.push(window.localStorage.key(i));
    }
  }
  this._keys.sort();
}

//key: Returns the name of the key at the position specified.
LocalStorage.prototype.key = function (keyindex) {
  var retVal = this._keys[keyindex];
  if (typeof retVal !== 'undefined') {
    // this needs to be a last and first;
    return this._keys[keyindex].replace(this._partition + '!', "").replace("!bin");
  } else {
    return retVal;
  }
};

//setItem: Saves and item at the key provided.
LocalStorage.prototype.setItem = function (key, value) {
  key = this._partition + "!" + key;

  if (value instanceof ArrayBuffer) {
    value = "ArrayBuffer:" + btoa(String.fromCharCode.apply(null, value));
  }

  if (value instanceof Uint8Array) {
    value = "Uint8Array:" + btoa(String.fromCharCode.apply(null, value));
  }

  var idx = utils.sortedIndexOf(this._keys, key);
  if (this._keys[idx] !== key) {
    this._keys.splice(idx, 0, key);
  }
  window.localStorage.setItem(key, value);
};

//getItem: Returns the item identified by it's key.
LocalStorage.prototype.getItem = function (key) {
  var value;

  key = this._partition + "!" + key;
  var retval = window.localStorage.getItem(key);
  if (retval == null) {
    return undefined;
  }

  if (retval.indexOf('ArrayBuffer:') === 0) {
    value = retval.replace("ArrayBuffer:", "");
    retval = new ArrayBuffer(atob(value).split('').map(function (c) {
      return c.charCodeAt(0);
    }));
    return retval;
  }

  if (retval.indexOf('Uint8Array:') === 0) {
    value = retval.replace("Uint8Array:", "");
    //This should be in but there seems to be a bug in TAPE?
    /*
     retval = new Uint8Array(atob(value).split('').map(function(c) {
     return c.charCodeAt(0);
     }));
     */
    return atob(value);
  }
  return retval;
};

//removeItem: Removes the item identified by it's key.
LocalStorage.prototype.removeItem = function (key) {
  key = this._partition + "!" + key;

  var idx = utils.sortedIndexOf(this._keys, key);
  if (this._keys[idx] === key) {
    this._keys.splice(idx, 1);
    window.localStorage.removeItem(key);
  }
};

//clear: Removes all of the key value pairs.
LocalStorage.prototype.clear = function () {
  window.localStorage.clear();
};

LocalStorage.prototype.length = function () {
  return this._keys.length;
};

exports.LocalStorage = LocalStorage;
