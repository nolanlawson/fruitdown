'use strict';

if (typeof process !== 'undefined' && !process.browser) {
  global.indexedDB = require('fake-indexeddb');
}

var tape   = require('tape');
var lib = require('../');
var testCommon = require('./testCommon');
var testBuffer = new Buffer('hello');

require('abstract-leveldown/abstract/leveldown-test').args(lib, tape);
require('abstract-leveldown/abstract/open-test').args(lib, tape, testCommon);
require('abstract-leveldown/abstract/del-test').all(lib, tape, testCommon);
require('abstract-leveldown/abstract/put-test').all(lib, tape, testCommon);
require('abstract-leveldown/abstract/get-test').all(lib, tape, testCommon);
require('abstract-leveldown/abstract/put-get-del-test').all(
  lib, tape, testCommon, testBuffer);
require('abstract-leveldown/abstract/close-test').close(lib, tape, testCommon);
require('abstract-leveldown/abstract/iterator-test').all(lib, tape, testCommon);

require('abstract-leveldown/abstract/chained-batch-test').all(lib, tape, testCommon);
require('abstract-leveldown/abstract/approximate-size-test').setUp(lib, tape, testCommon);
require('abstract-leveldown/abstract/approximate-size-test').args(lib, tape, testCommon);

require('abstract-leveldown/abstract/ranges-test').all(lib, tape, testCommon);
require('abstract-leveldown/abstract/batch-test').all(lib, tape, testCommon);

require('./custom-tests.js').all(lib, tape, testCommon);

