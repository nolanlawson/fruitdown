'use strict';

var util = require('util');
var AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN;
var AbstractIterator = require('abstract-leveldown').AbstractIterator;
var noop = function () {
};
var nextTick = global.setImmediate || process.nextTick;

function LDIterator(db, options) {

  AbstractIterator.call(this, db);

  this._dbsize = this.db.container.length();
  this._reverse = !!options.reverse;
  this._end     = options.end;
  this._start   = options.start;
  this._gt      = options.gt;
  this._gte     = options.gte;
  this._lt      = options.lt;
  this._lte     = options.lte;
  this._exclusiveStart = options.exclusiveStart;
  this._limit = options.limit;
  this._count = 0;

  if (this._start) {
    this._pos = this.db.container.indexOfKey(this._start);
    if (this._reverse) {
      if (this._exclusiveStart || this.db.container.key(this._pos) !== this._start) {
        this._pos--;
      }
    } else if (this._exclusiveStart && this.db.container.key(this._pos) === this._start) {
      this._pos++;
    }
  } else {
    this._pos = this._reverse ? this._dbsize - 1 : 0;
  }
}

util.inherits(LDIterator, AbstractIterator);

LDIterator.prototype._next = function (callback) {

  if (this._pos >= this.db.container.length() || this._pos < 0) {
    return nextTick(callback);
  }
  var key = this.db.container.key(this._pos);

  if (!!this._end && (this._reverse ? key < this._end : key > this._end)) {
    return nextTick(callback);
  }

  if (!!this._limit && this._limit > 0 && this._count++ >= this._limit) {
    return nextTick(callback);
  }

  if ((this._lt  && key >= this._lt) ||
    (this._lte && key > this._lte) ||
    (this._gt  && key <= this._gt) ||
    (this._gte && key < this._gte)) {
    return nextTick(callback);
  }

  var value = this.db.container.getItem(key);
  this._pos += this._reverse ? -1 : 1;

  nextTick(function () { callback(null, key, value); });
};

function LD(location) {
  if (!(this instanceof LD)) {
    return new LD(location);
  }
  AbstractLevelDOWN.call(this, location);
  var Wstore = require('./localstorage').LocalStorage;
  this.container = new Wstore(location);
}

util.inherits(LD, AbstractLevelDOWN);

LD.prototype._open = function (options, callback) {
  nextTick(function () {
    callback(null, this);
  }.bind(this));
};

LD.prototype._put = function (key, value, options, callback) {

  var err = checkKeyValue(key, 'key');

  if (err) {
    return callback(err);
  }

  err = checkKeyValue(value, 'value');

  if (err) {
    return callback(err);
  }

  if (typeof value === 'object' && !Buffer.isBuffer(value) && value.buffer === undefined) {
    var obj = {};
    obj.storetype = "json";
    obj.data = value;
    value = JSON.stringify(obj);
  }

  this.container.setItem(key, value);
  nextTick(callback);
};

LD.prototype._get = function (key, options, callback) {

  var err = checkKeyValue(key, 'key');

  if (err) {
    return callback(err);
  }

  if (!isBuffer(key)) {
    key = String(key);
  }
  var value = this.container.getItem(key);

  if (value === undefined) {
    // 'NotFound' error, consistent with LevelDOWN API
    return nextTick(function () {
      callback(new Error('NotFound: '));
    });
  }


  if (options.asBuffer !== false && !Buffer.isBuffer(value)) {
    value = new Buffer(value);
  }


  if (options.asBuffer === false) {
    if (value.indexOf("{\"storetype\":\"json\",\"data\"") > -1) {
      var res = JSON.parse(value);
      value = res.data;
    }
  }

  nextTick(function () {
    callback(null, value);
  });
};

LD.prototype._del = function (key, options, callback) {

  var err = checkKeyValue(key, 'key');

  if (err) {
    return callback(err);
  }
  if (!isBuffer(key)) {
    key = String(key);
  }

  this.container.removeItem(key);
  nextTick(callback);
};

LD.prototype._batch = function (array, options, callback) {
  var err;
  var i = 0;
  var key;
  var value;
  if (Array.isArray(array)) {
    for (; i < array.length; i++) {
      if (array[i]) {
        key = Buffer.isBuffer(array[i].key) ? array[i].key : String(array[i].key);
        err = checkKeyValue(key, 'key');
        if (err) {
          return nextTick(callback.bind(null, err));
        }
        if (array[i].type === 'del') {
          this._del(array[i].key, options, noop);
        } else if (array[i].type === 'put') {
          value = Buffer.isBuffer(array[i].value) ? array[i].value : String(array[i].value);
          err = checkKeyValue(value, 'value');
          if (err) {
            return nextTick(callback.bind(null, err));
          }
          this._put(key, value, options, noop);
        }
      }
    }
  }
  nextTick(callback);
};

LD.prototype._iterator = function (options) {
  return new LDIterator(this, options);
};

LD.destroy = function (name, callback) {
  try {
    Object.keys(localStorage)
      .forEach(function (key) {
        if (key.substring(0, name.length + 1) === (name + "!")) {
          localStorage.removeItem(key);
        }
      });
    callback();
  } catch (e) {
    // fail gracefully if no LocalStorage
  }
};

function isBuffer(buf) {
  return buf instanceof ArrayBuffer;
}

function checkKeyValue(obj, type) {
  if (obj === null || obj === undefined) {
    return new Error(type + ' cannot be `null` or `undefined`');
  }
  if (obj === null || obj === undefined) {
    return new Error(type + ' cannot be `null` or `undefined`');
  }

  if (type === 'key') {

    if (obj instanceof Boolean) {
      return new Error(type + ' cannot be `null` or `undefined`');
    }
    if (obj === '') {
      return new Error(type + ' cannot be empty');
    }
  }
  if (obj.toString().indexOf("[object ArrayBuffer]") === 0) {
    if (obj.byteLength === 0 || obj.byteLength === undefined) {
      return new Error(type + ' cannot be an empty Buffer');
    }
  }

  if (isBuffer(obj)) {
    if (obj.length === 0) {
      return new Error(type + ' cannot be an empty Buffer');
    }
  } else if (String(obj) === '') {
    return new Error(type + ' cannot be an empty String');
  }
}


module.exports = LD;
