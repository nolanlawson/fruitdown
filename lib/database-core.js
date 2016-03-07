'use strict';

//
// Class that should contain everything necessary to interact
// with IndexedDB as a generic key-value store (based on LocalStorage).
//

/* global indexedDB */

var STORE = 'fruitdown';

// see http://stackoverflow.com/a/15349865/680742
var nextTick = global.setImmediate || process.nextTick;

// IE has race conditions, which is what these two caches work around
// https://gist.github.com/nolanlawson/a841ee23436410f37168
var cachedDBs = {};
var openReqList = {};

function StorageCore(dbName) {
  this._dbName = dbName;
}

function getDatabase(dbName, callback) {
  if (cachedDBs[dbName]) {
    return nextTick(function () {
      callback(null, cachedDBs[dbName]);
    });
  }

  var req = indexedDB.open(dbName, 1);

  openReqList[dbName] = req;

  req.onupgradeneeded = function (e) {
    var db = e.target.result;

    // Apple migration bug (https://bugs.webkit.org/show_bug.cgi?id=136888)
    // This will be null the first time rather than 0, so check for 1
    if (e.oldVersion === 1) {
      return;
    }

    // Create a superfluous secondary index purely so we can do
    // openKeyCursor(). (Limitation of the IndexedDB API, fixed in v2.0.)
    // We would also use this for detecting ConstraintErrors, but that
    // doesn't work in Safari: https://bugs.webkit.org/show_bug.cgi?id=149107
    db.createObjectStore(STORE).createIndex('fakeKey', 'fakeKey');

  };

  req.onsuccess = function (e) {
    var db = cachedDBs[dbName] = e.target.result;
    callback(null, db);
  };

  req.onerror = function(e) {
    var msg = 'Failed to open indexedDB, are you in private browsing mode?';
    console.error(msg);
    callback(e);
  };
}

function openTransactionSafely(db, mode) {
  try {
    return {
      txn: db.transaction(STORE, mode)
    };
  } catch (err) {
    return {
      error: err
    };
  }
}

StorageCore.prototype.getKeys = function (callback) {
  getDatabase(this._dbName, function (err, db) {
    if (err) {
      return callback(err);
    }
    var txnRes = openTransactionSafely(db, 'readonly');
    if (txnRes.error) {
      return callback(txnRes.error);
    }
    var txn = txnRes.txn;
    var store = txn.objectStore(STORE);

    txn.onerror = callback;

    var keys = [];
    txn.oncomplete = function () {
      // Safari has a bug where these keys aren't returned in sorted
      // order, so we have to sort them explicitly
      // https://bugs.webkit.org/show_bug.cgi?id=149205
      callback(null, keys.sort());
    };

    // using openKeyCursor avoids reading in the whole value,
    // which may be large
    var req = store.index('fakeKey').openKeyCursor();

    req.onsuccess = function (e) {
      var cursor = e.target.result;
      if (!cursor) {
        return;
      }
      keys.push(cursor.primaryKey);
      cursor.continue();
    };
  });
};

StorageCore.prototype.put = function (key, value, callback) {
  getDatabase(this._dbName, function (err, db) {
    if (err) {
      return callback(err);
    }
    var txnRes = openTransactionSafely(db, 'readwrite');
    if (txnRes.error) {
      return callback(txnRes.error);
    }
    var txn = txnRes.txn;
    var store = txn.objectStore(STORE);

    var valueToStore = typeof value === 'string' ? value : value.toString();

    txn.onerror = callback;
    txn.oncomplete = function () {
      callback();
    };

    store.put({value: valueToStore, fakeKey: 0}, key);
  });
};

StorageCore.prototype.get = function (key, callback) {
  getDatabase(this._dbName, function (err, db) {
    if (err) {
      return callback(err);
    }
    var txnRes = openTransactionSafely(db, 'readonly');
    if (txnRes.error) {
      return callback(txnRes.error);
    }
    var txn = txnRes.txn;
    var store = txn.objectStore(STORE);

    var gotten;
    var req = store.get(key);
    req.onsuccess = function (e) {
      if (e.target.result) {
        gotten = e.target.result.value;
      }
    };

    txn.onerror = callback;
    txn.oncomplete = function () {
      callback(null, gotten);
    };
  });
};

StorageCore.prototype.remove = function (key, callback) {
  getDatabase(this._dbName, function (err, db) {
    if (err) {
      return callback(err);
    }
    var txnRes = openTransactionSafely(db, 'readwrite');
    if (txnRes.error) {
      return callback(txnRes.error);
    }
    var txn = txnRes.txn;
    var store = txn.objectStore(STORE);

    store.delete(key);

    txn.onerror = callback;
    txn.oncomplete = function () {
      callback();
    };
  });
};

StorageCore.destroy = function (dbName, callback) {
  nextTick(function () {
    //Close open request for "dbName" database to fix ie delay.
    if (openReqList[dbName] && openReqList[dbName].result) {
      openReqList[dbName].result.close();
      delete cachedDBs[dbName];
    }
    var req = indexedDB.deleteDatabase(dbName);

    req.onsuccess = function () {
      //Remove open request from the list.
      if (openReqList[dbName]) {
        openReqList[dbName] = null;
      }
      callback(null);
    };

    req.onerror = callback;
  });
};

module.exports = StorageCore;
