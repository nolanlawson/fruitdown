# FruitDOWN

A browser-based LevelDOWN adapter that works over all implementations of IndexedDB, including Apple's buggy version.

This is designed for environments where you can't use WebSQL as a polyfill for Apple browsers, such as:

* WKWebView, which [doesn't have WebSQL](https://bugs.webkit.org/show_bug.cgi?id=137760)
* Safari/iOS, but don't want [an annoying popup](http://pouchdb.com/errors.html#not_enough_space) after you reach 5MB
* Safari/iOS, but you need to store more than 50MB, which [doesn't work in WebSQL](http://www.html5rocks.com/en/tutorials/offline/quota-research/) but [works in IndexedDB](https://github.com/nolanlawson/database-filler).

This project is intended for use with the [level eco-system](https://github.com/level/).

## Design

This project is a fork of [localstorage-down](https://github.com/No9/localstorage-down).

## Status 

[![browser support](https://ci.testling.com/no9/localstorage-down.png)](https://ci.testling.com/no9/localstorage-down)

## Install

```
npm install localstorage-down
```

## Browser support

Basically we support [any browser that has localStorage](http://caniuse.com/namevalue-storage), but since we also rely on an ES5 environment due to dependencies from abstract-leveldown, in practice you will need the following shims in order to work correctly on all browsers (e.g. IE 8/9):

* [typedarray](https://github.com/substack/typedarray) for binary storage
* [es5-shim](https://github.com/es-shims/es5-shim) for just about everything

## Example 

At the command prompt in your chosen directory : 

```
npm install localstorage-down
npm install levelup 
npm install browserify -g
npm install beefy -g
```

Create a file called index.js and enter the following:

```
var localstorage = require('localstorage-down');
var levelup = require('levelup');
var db = levelup('/does/not/matter', { db: localstorage });

db.put('name', 'Yuri Irsenovich Kim');
db.put('dob', '16 February 1941');
db.put('spouse', 'Kim Young-sook');
db.put('occupation', 'Clown');

db.readStream()
   .on('data', function (data) {
      if (typeof data.value !== 'undefined') {
         console.log(data.key, '=', data.value);
      }
   })
   .on('error', function (err) {
      console.log('Oh my!', err);
   })
   .on('close', function () {
      console.log('Stream closed');
   })
   .on('end', function () {
     console.log('Stream ended');
   });
```

Publish the site :

```
beefy index.js
```

See the output :

[http://localhost:9966](http://localhost:9966)

Listen to John Cage :

http://www.youtube.com/watch?v=ExUosomc8Uc 

## Tests

```
npm run test
```

Browse to [http://localhost:9966](http://localhost:9966). 
View console logs in the browser to see test output. 

##  Contributors

Anton Whalley https://github.com/no9

Adam Shih https://github.com/adamshih

Nolan Lawson https://github.com/nolanlawson
