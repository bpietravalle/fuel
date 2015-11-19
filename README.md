# Fuel

Fuel is a lightweight constructor to help DRY up common Command and Query operations 
across your angular services while maintaing a flat, scalable JSON data structure. 
This module is designed for angular services using:
* [Firebase](https://www.firebase.com/)
* [angularFire](https://github.com/firebase/angularfire)
* [Geofire](https://github.com/firebase/geofire-js)

I apologize if you aren't using these in your code, but you really need to get with the program.


## Installation & Setup

```bash
$ npm install firebase.fuel --save
```

```bash
$ bower install firebase.fuel --save
```

1.) Include Fuel in your app dependencies.

```javascript
angular.module("yourApp",['firebase.fuel']);
```
2.) Define a root node constant.  The Fuel service will look for a constant called
'FBURL'. If you'd prefer to have Fuel look for a different constant, you can do so,
as explained below. Either way make sure the constant is available in your module.

```javascript

(function(){
    "use strict";

    angular.module("yourApp")
	 .constant("FBURL", "http://your-firebase.firebaseio.com");


})();
```
### Repo Terminology

Though we are both literally on the same page right now.  Let's make sure we are
figuratively as well:

1. _main_: Adjective reserved for anything(eg, an angularFire service) found in a direct child of your root firebaseRef. 

2. _nested_: Adjective reserved for any child of the main node. 

For example:
```javascript
/*  https://your-firebase.firebaseio.com/trips */
$firebaseArray //mainArray

/* https://your-firebase.firebaseio.com/trips/tripId */
$firebaseObject //mainRecord

/*  https://your-firebase.firebaseio.com/trips/tripId/tickets */
$firebaseArray //nestedArray

/* https://your-firebase.firebaseio.com/trips/tripId/tickets/ticketId */
$firebaseObject //nestedRecord
```

## Usage

The Fuel service takes 2 arguments:

```javascript
	 fuel(path, options);
```
1. _path_: String of the Firebase node your angular service will manage. This should
be a direct child of your root firebaseRef. 

2. _options_: Options hash.  See below.


## Conventions

1. *Syntax*: I've tried to keep naming conventions to a minimum.  You can follow 
your own convention, however Fuel's defaults for nodes and arrays are plural nouns,
while defaults for records, objects, and angular services singluar.  The one
exception is that the default Geofire node and service are both called "geofire". 

Example:
```javascript

(function(){
    "use strict";

    angular.module("yourApp")
	 .factory("trip", tripFactory)
	 .factory("geofire", geofireFactory);

	 /** @ngInject */
	 function tripFactory(Fuel){
			return fuel("trips");
	 }

	 /** @ngInject */
	 function geofireFactory(Fuel){
			return fuel("geofire");
	 }

})();

```
Again, you can follow your own convention and override the defaults for all operations on the main node.
Nested arrays, however, are another story.  Fuel follows the above naming convention for constructing CRUD methods
for nested arrays and nested records.  

2. SRP:  


## Contributing

Yes, please.  Below should get you setup.

```bash
$ git clone https://github.com/bpietravalle/fuel.git
$ cd fuel
$ npm install               # install dependencies
```
Refer to the [generator-gulp-angular](https://github.com/Swiip/generator-gulp-angular) for full list of commands. The commands
for unit tests are:

```bash
* gulp test #run test suite once
* gulp test:auto #watch files and run tests continually
```




