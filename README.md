# FruitDOWN [![Build Status](https://travis-ci.org/nolanlawson/fruitdown.svg?branch=master)](https://travis-ci.org/nolanlawson/fruitdown)


A browser-based LevelDOWN adapter that works over all implementations of IndexedDB, including Apple's buggy version.

This is designed for environments where you can't use WebSQL as a polyfill for Safari browsers, such as:

* WKWebView, which [doesn't have WebSQL](https://bugs.webkit.org/show_bug.cgi?id=137760)
* Safari/iOS, but you don't want [an annoying popup](http://pouchdb.com/errors.html#not_enough_space) after you reach 5MB
* iOS, but you need to store more than 50MB, which [works in IndexedDB](https://github.com/nolanlawson/database-filler) but [not in WebSQL](http://www.html5rocks.com/en/tutorials/offline/quota-research/)

This project is intended for use with the [Level ecosystem](https://github.com/level/), including as a [PouchDB](http://pouchdb.com) adapter (coming soon).

## Install

```
npm install fruitdown
```

## Browser support

Tested in:

* **Android**: 4.4, 5.0, 5.1
* **Firefox**: 38-42
* **Chrome**: 42-beta
* **IE**: 10-11
* **iPhone**: 8.0-9.1
* **Safari**: 7.1-9

## Background

IndexedDB support is pretty awful these days. Every browser except for Chrome and Firefox has tons of bugs, but Safari's are arguably [the](https://gist.github.com/nolanlawson/08eb857c6b17a30c1b26) [worst](http://www.raymondcamden.com/2014/09/25/IndexedDB-on-iOS-8-Broken-Bad).  While there are well-known workarounds for [Microsoft's bugs](https://gist.github.com/nolanlawson/a841ee23436410f37168), most IndexedDB wrappers just gave up and didn't support Apple IndexedDB. [PouchDB](http://pouchdb.com), [LocalForage](http://mozilla.github.io/localForage/), [YDN-DB](http://dev.yathit.com/ydn-db/downloads.html), [Lovefield](https://github.com/google/lovefield), [Dexie](http://dexie.org/), and [Level.js](https://github.com/maxogden/level.js) all either fall back to WebSQL or recommend that you use the [IndexedDBShim](https://github.com/axemclion/IndexedDBShim).

This library is different. It does all the weird backflips you have to do to support Apple IndexedDB.

## Design

This project is a fork of [localstorage-down](https://github.com/No9/localstorage-down). It uses a tiny subset of the IndexedDB API &ndash; just those parts that are supported in Firefox, Chrome, Safari, and IE. The #1 goal is compatibility with as many browsers as possible. The #2 goal is performance.

Only one object store is ever opened, because Apple's implementation [does not allow you to open more than one at once](https://bugs.webkit.org/show_bug.cgi?id=136937). So presumably you would use something like [level-sublevel](https://github.com/dominictarr/level-sublevel/) to prefix keys. Also every operation is its own transaction, so you should not count on standard IndexedDB transaction guarantees, even when you use `batch()`. However, internally the lib does its own batching, and supports [snapshots](https://github.com/Level/leveldown#snapshots).

All keys are kept in memory, which is bad for memory usage but actually a win for performance, since IDBCursors are slow. However, the database creates two indexes, because 1) the primary index does not support `openKeyCursor()` per the IndexedDB 1.0 spec, and we want to use it to avoid reading in large values during key iteration, but 2) secondary indexes [do not correctly throw ConstraintErrors in Safari](https://bugs.webkit.org/show_bug.cgi?id=149107). So unfortunately there's a superfluous extra index. ¯\\\_(ツ)\_/¯

Another limitation is that both keys and values are converted to strings before being stored. So instead of efficiently using Blobs or even JSON objects, binary strings are stored instead. This is okay, though, because Chrome < 43 (and therefore pre-Lollipop Android) [does not store Blobs correctly](https://code.google.com/p/chromium/issues/detail?id=447836), and Safari [doesn't support Blob storage either](https://bugs.webkit.org/show_bug.cgi?id=143193).

To avoid [concurrency bugs in IE/Edge](https://gist.github.com/nolanlawson/a841ee23436410f37168), this project borrows PouchDB's system of maintaining a global cache of databases and only ever using one database per name.

## Browser support

FruitDOWN supports [any browser that has IndexedDB](http://caniuse.com/#feat=indexeddb), even those with partial support. Notably:

* Safari 7.1+
* iOS 8+
* IE 10+
* Chrome 23+
* Firefox 10+
* Android 4.4+

The buggy [Samsung/HTC IndexedDB variants](https://github.com/pouchdb/pouchdb/issues/1207) based on an older version of the IndexedDB spec, which you will occasionally find in Android 4.3, are not supported.


## Future

Apple have [pledged to fix IndexedDB](https://twitter.com/grorgwork/status/618152677281697792). When they do, you should stop using this library and use [Level.js](https://github.com/maxogden/level.js) or another IndexedDB wrapper instead.


## Tests

    npm run dev

Browse to [http://localhost:9966](http://localhost:9966).
View console logs in the browser to see test output.

## Automated tests

Browser:


    BROWSER=firefox npm test
    BROWSER=chrome npm test

[FakeIndexedDB](https://github.com/dumbmatter/fakeIndexedDB) in Node:


    npm run test-fakeindexeddb

PhantomJS tests:

    npm run test-phantom

##  Thanks

Thanks to [Anton Whalley](https://github.com/no9), [Adam Shih](https://github.com/adamshih) and everybody else who contributed to localstorage-down. Also thanks to everybody who worked on PouchDB, where most of these IndexedDB bugs were discovered.
