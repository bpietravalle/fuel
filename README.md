# fuel

fuel is a lightweight constructor to help DRY up common CRUD operations across your angular
services while maintaing a flat, scalable JSON data structure. This module is specifically 
for angular services using firebase and Geofire. 


## Installation & Setup

```bash
$ npm install firebase.fuel --save
```

```bash
$ bower install firebase.fuel --save
```

1.) Include fuel in your app dependencies.

```javascript
angular.module("yourApp",['firebase.fuel']);
```
2.) Inject fuel service into your angular service.

```javascript

(function(){
    "use strict";

    angular.module("yourApp")
	 .factory("yourFactory", yourFactory);

	 /** @ngInject */
	 function yourFactory(fuel){

	 }

})();
```
3.) Define a root node constant.  The fuel service will look for a constant called 'FBURL'.
If you'd prefer to have fuel look for a different constant, you can do so, as explained below.
Either way make sure the constant is available in your module.

```javascript

(function(){
    "use strict";

    angular.module("yourApp")
	 .constant("FBURL", "http://your-firebase.firebaseio.com");


})();
```
## Usage

The fuel service takes 2 arguments:

```javascript
	 fuel(path, options);
```
1. _path_: String of the firebase node your angular service will manage.This should a direct child of your root firebaseRef.   

2. _options_: 

## Conventions

1. Naming: I've tried to keep a reliance on syntax to a minimum.  I simply recommend keeping nodes and arrays plural and records, objects, and angular classes singluar.  You can choose 

2. SRP: 


## Contributing

Yes, please.  Below should get you setup.

```bash
$ git clone https://github.com/bpietravalle/fuel.git
$ cd fuel
$ npm install               # install dependencies
```
Refer to the gulp-angular generator by Swiip for full list of commands. The commands
for unit tests are:

```bash
* gulp test #run test suite once
* gulp test:auto #watch files and run tests continually
```




