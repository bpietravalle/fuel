# Fuel

Fuel is a lightweight provider useful for DRYing up common command and query operations 
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
2.) Define your root url in a config block using the `setRoot` method.

```javascript

(function(){
    "use strict";

    angular.module("yourApp")
			.config(function(fuelProvider){
				 fuelProvider.setRoot("http://your-firebase.firebaseio.com");
			});

})();
```
### Repo Terminology

Though we are both literally on the same page right now, let's make sure we are
figuratively as well:

1. _main_: Adjective reserved for any firebaseRef or angularFire service found at a direct child of your root firebaseRef. 

2. _nested_: Adjective reserved for any firebaseRef or angularFire service found at a child of a main node. 

3. _index_: used as the [pros](https://www.firebase.com/docs/web/guide/structuring-data.html) do.

For example:
```javascript
/* mainArray - $firebaseArray 
*  https://your-firebase.firebaseio.com/trips */

/* mainRecord - $firebaseObject
* https://your-firebase.firebaseio.com/trips/tripId */

/* nestedArray - $firebaseArray (or an index) 
* https://your-firebase.firebaseio.com/trips/tripId/cities*/

/* nestedRecord - $firebaseObject
* https://your-firebase.firebaseio.com/trips/tripId/tickets/cities/cityId */
```

## Usage

The Fuel provider takes 2 arguments:

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
	 function tripFactory(fuel){
			return fuel("trips");
	 }

	 /** @ngInject */
	 function geofireFactory(fuel){
			return fuel("geofire");
	 }

})();

```
Again, you can follow your own convention and override the defaults for all operations
 on the main node. Nested arrays, however, are another story.  Fuel follows the above 
naming convention for constructing CRUD methods for nested arrays and nested records. 
To mainpulate nested data using a different naming convention you can do so manually.

2. _SRP_:  Fuel cannot directly manipulate/query other main firebase nodes. 
To access other direct child nodes of your root firebaseRef, you can call methods on
a few predefined services that are injected on initialization.  Currently, these services
are: 'session','user','location','geofire'.


## Configuration

You can configure Fuel by adding predefined keys to the options hash.  There are 6 core
options.

options[key] | Type | Result
-------------|------|-------------
geofire| Boolean | adds methods to persist/query geospatial data to/in Geofire
gps| Boolean | adds a simple API to your app's geofire service
nestedArrays| Array | `["child","nodes",]`
session | Boolean | adds a simple API for your app's session service/object
user | Boolean | adds a simple API for your app's user service (and session as well) 

##### gps vs geofire
These keys are confusing, and perhaps need to be renamed.  Anyhow, in keeping with convention #2, 
services that have geospatial data to persist and query are not responsible for actually
executing the given queries/commands. So:

```javascript
(function(){
    "use strict";

    angular.module("yourApp")
			.factory("trip", tripFactory)
			.factory("geofire", geofireFactory);

// a service that has gps data associated with its ontology
	 /** @ngInject */
	 function tripFactory(fuel){
			return fuel("trips",{
				gps: true
			});
	 }

// a service that has prefined methods for managing geospatial data
	 /** @ngInject */
	 function geofireFactory(fuel){
			return fuel("geofire",{
				 geofire: true
			});
	 }

})();

```


### *Geofire Interface*

By adding `geofire: true` to the options hash, fuel will persist/query any location
data on behalf of your other services.

Fuel separates longitude and latitude from other data associated with a location (_eg_, placeIds, 
reviews, etc.). This will allow you to associate more than one location with a given firebase node
Fuel will send non-coordinate data to a firebase Node, and will then send coordinates to a geofire node.
Currently, the default names are "locations" and "geofire" respectively.  Default names for coordinates
are 'lat' and 'lon'. These keys are only necessary for communicating with your controller; Geofire follows
its own methodology.

*REQs*:
* Your controller/view will need to save coordinates in a data object with 'lat'/'lon' keys. See below for 
renaming these keys.
* Your app will need to specify two separate fireBase nodes(as well as angular services) for fuel
to work properly. For example:
```javascript
(function(){
    "use strict";

    angular.module("yourApp")
			.factory("location", locationFactory)
			.factory("geofire", geofireFactory);


	 /*For all location-data
	 * https://your-firebase.firebaseio.com/locations */

	 /** @ngInject */
	 function locationFactory(fuel){
			return fuel("locations",{
				 geofire: true
			});
	 }

	 /*For all coordinates
	 * https://your-firebase.firebaseio.com/geofire */

	 /** @ngInject */
	 function geofireFactory(fuel){
			return fuel("geofire",{
				 geofire: true
			});
	 }
})();
```


### *GPS Interface*
By adding `gps: true` to the options hash, fuel will:

* send location data to your Geofire services defined above
* save/remove a location Index in your main node

*REQs*:
* Follow setup for Geofire interface 
* Specify a locations index in your security rules. See below for overriding
the default names.

For example:
```javascript
(function(){
    "use strict";

    angular.module("yourApp")
			.factory("trip", tripFactory);

	 /** @ngInject */
	 function tripFactory(fuel){
			return fuel("trips",{
				 gps: true
			});
	 }
	 //make sure that 'https://your-firebase.firebaseio.com/trips/tripId/locations' is defined!

}();
```
### *NestedArrays*
By adding `nestedArrays: []` to the options hash, fuel will construct
a few methods for manipulating/querying nested arrays/records.  
For example:

```javascript
fuel("users",{
  nestedArrays: ["phones"]
});

/* Will expose the firebase node 'https://your-fb.com/users/userId/phones',
* via the following methods.
*/

phone(key)
phones()
addPhone(data)
getPhone(key)
loadPhone(key)
loadPhones()
removePhone(idxOrRec)
savePhone(key)
```


### *Session Interface*

By adding `session: true` to the options hash, fuel adds a very simple API for sharing 
data between your app's session and the given firebase node.  

*REQs*:
1. _injector_: fuel will try to inject a 'session' service.  Make sure it's available. 
See below for overriding these names.

2. _IdMethod_: fuel also expects the session service to have a method for querying ids stored
in session.  The default is 'getId'.  See below for overriding this name.

Again, very simple but it allows your service to maintain a current Record with very little code.

### *User Interface*

By adding `user: true` to the options hash, fuel will:
* save/remove an index in your user object 
* add a `uid` property to any record created in the main Array
* queries user records based on the user index or uid property

*REQs*:
1. _index_: fuel will look for an index with the same name as the main node.
You need to specify the index in your security rules.

For example:
```javascript
	 fuel("trips",{
			user: true
	 };
//make sure that 'https://your-firebase.firebaseio.com/users/userId/trips' is defined!
```
2. _injector_: fuel will try to inject a 'user' service.  Make sure it's
 available. See below for overriding these names.

3. _uid_: Your security rules will need to allow for a uid property. To opt-out of
this functionality simply add `uid: false` to the options hash.  You can also specify a
a different name via the 'uidProperty' option, as described below.

_Note_: This option also provides the session mngt functionality described above.  No need
to add `session: true`, however if you want to be redundant redundant, please be my guest.



### Overriding Defaults 
Here are the current defaults and the required options to override them.

*Nodes and Services*

options[key] | Type | Default Value
-------------|------|--------------
geofireNode | String | "geofire"
geofireService | String | "geofire"
locationNode | String | "locations"
locationService | String | singular of locationNode
sessionService | String | "session"
sessionIdMethod | String | "getId"
userNode | String | "users"
userService | String | singular of userNode


*Properties*

options[key] | Type | Default Value
-------------|------|--------------
latitude| String| "lat"
longitude| String| "lon"
uidProperty| String | "uid"



## Contributing
Yes, please.  Below should get you setup.

```bash
$ git clone https://github.com/bpietravalle/fuel.git
$ cd fuel
$ npm install               # install dependencies
```
Refer to the [generator-gulp-angular](https://github.com/Swiip/generator-gulp-angular) for a full list of commands. The commands
for unit tests are:

```bash
gulp test #run test suite once
gulp test:auto #watch files and run tests continually
```




