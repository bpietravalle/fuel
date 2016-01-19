(function() {
    "use strict";
    var Fuel;

    angular
        .module('firebase.fuel.services')
        .factory("fuel", FuelFactory);

    /** @ngInject */
    function FuelFactory($timeout, utils, firePath, $q, $log, $injector) {

        /**
         * @constructor
         * @param{Array} path ["path", "to,"child","node"]
         * @param{Object} options - options hash - see below
         */

        return function(path, options) {
            var fb = new Fuel($timeout, utils, firePath, $q, $log, $injector, path, options);
            return fb.construct();
        };
    }

    Fuel = function($timeout, utils, firePath, $q, $log, $injector, path, options) {
        this._timeout = $timeout;
        this._utils = utils;
        this._firePath = firePath;
        this._q = $q;
        this._log = $log;
        this._injector = $injector;
        this._path = path;
        this._options = this._utils.paramCheck(options, "obj", {});
        this._pathOptions = {};

        /*Core Options */
        this._geofire = this._utils.paramCheck(this._options.geofire, "bool", false);
        this._gps = this._utils.paramCheck(this._options.gps, "bool", false);
        this._nestedArrays = this._utils.paramCheck(this._options.nestedArrays, "arr", []);
        this._session = this._utils.paramCheck(this._options.session, "bool", false);
        this._user = this._utils.paramCheck(this._options.user, "bool", false);
        this._timeStamp = this._utils.paramCheck(this._options.timeStamp, "bool", false);
        if (this._gps === true && this._geofire === true) {
            throw new Error("Invalid options. Please remove either 'gps' or 'geofire' from the options hash");
        }
        if (this._user === true && this._geofire === true) {
            throw new Error("Invalid options  Please remove 'user' or 'geofire' from your options hash.");
        }

        /******************
         * Additional Config
         * *****************/

        /* GPS & Geofire */
        if (this._gps === true || this._geofire === true) {

            this._geofireNode = this._utils.paramCheck(this._options.geofireNode, "str", "geofire");
            this._latitude = this._utils.paramCheck(this._options.latitude, "str", "lat");
            this._longitude = this._utils.paramCheck(this._options.longitude, "str", "lon");

            this._pathOptions.geofire = true;
        }


        if (this._geofire === true) {
            this._foreignKeys = this._utils.paramCheck(this._options.foreignKeys, "obj", {});
        }

        if (this._gps === true) {
            this._addRecordKey = this._utils.paramCheck(this._options.addRecordKey, "bool", true);
            this._points = this._utils.paramCheck(this._options.points, "str", this._path);
            this._geofireIndex = this._utils.paramCheck(this._options.geofireIndex, "str", "locations");
            this._geofireService = this._utils.paramCheck(this._options.geofireService, "str", "geofire");
            this._geofireObject = this._injector.get(this._geofireService);
        }


        /* User  & Session */
        if (this._user === true || this._session === true) {
            this._uid = this._utils.paramCheck(this._options.uid, "bool", true);
            this._uidProperty = this._utils.paramCheck(this._options.uidProperty, "str", "uid");
        }
        if (this._user === true) {
            this._userNode = this._utils.paramCheck(this._options.userNode, "str", "users");
            this._userService = this._utils.paramCheck(this._options.userService, "str", this._utils.singularize(this._userNode));
            this._userObject = this._injector.get(this._userService);
            this._session = true;
        }
        if (this._session === true) {
            this._sessionService = this._utils.paramCheck(this._options.sessionService, "str", "session");
            this._sessionIdMethod = this._utils.paramCheck(this._options.sessionIdMethod, "str", "getId");
            this._sessionObject = this._injector.get(this._sessionService);
        }
        if (this._timeStamp === true) {
            this._createTime = this._utils.paramCheck(this._options.createTime, "str", "createdAt");
            this._updateTime = this._utils.paramCheck(this._options.updateTime, "str", "updatedAt");
        }

        this._pathMaster = this._firePath(this._path, this._pathOptions);
    };

    Fuel.prototype = {
        construct: function() {
            var self = this;
            var entity = {};

            entity.base = getCurrentBase;
            entity.ref = getCurrentRef;
            entity.path = getCurrentPath;
            entity.inspect = inspect;

            entity.mainRef = mainRef;
            entity.mainArray = mainArray;
            entity.mainRecord = mainRecord;

            /*Queries*/
            entity.load = load;
            entity.getRecord = getMainRecord;
            entity.queryByChild = queryByChild;
            entity.getIndexKeys = getIndexKeys;
            entity.bindTo = bindTo;

            /*Commands*/
            entity.save = save;
            entity.addIndex = addIndex;
            entity.removeIndex = removeIndex;

            if (self._user !== true && self._gps !== true && self._geofire !== true) {
                entity.add = basicAdd;
                entity.remove = removeMainRecord;
            }

            if (self._user === true) {
                entity.loadUserRecords = loadUserRecords;
            }

            if (self._gps === true) {
                entity.geoQuery = geoQuery;
                entity.removeCoords = removeCoords;
                entity.setCoords = setCoords;
                entity.getCoords = getCoords;
                entity.getLocation = getLocationRecord;
                entity.addLocations = sendToGeofireToAdd;
                entity.removeLocations = sendToGeofireToRemove;

                if (self._addRecordKey === true) {
                    entity.loadRecordLocations = sendToGeoFireToLoadLocations;
                }
            }

            if (self._user !== true && self._gps === true) {
                entity.add = createWithGps;
                entity.remove = removeWithGps;
            }

            if (self._user === true && self._gps !== true) {
                entity.add = createWithUser;
                entity.remove = removeWithUser;
            }

            if (self._user === true && self._gps === true) {
                entity.add = createWithUserAndGps;
                entity.remove = removeWithUserAndGps;
            }

            if (self._session === true) {
                entity.bindCurrent = bindCurrent;
                entity.current = current;
                entity.session = session;
                entity.sessionId = sessionId;
            }

            if (self._geofire === true) {
                entity.add = addLocations;
                entity.addRecordKey = addRecordKey;
                entity.geofire = makeGeofire;
                entity.get = getGeofire;
                entity.loadRecordLocations = loadRecordLocations;
                entity.query = queryGeofire;
                entity.remove = removeLocations;
                entity.set = setGeofire;
            }

            getCurrentRef();

            switch (self._nestedArrays) {
                case []:
                    break;
                default:
                    return addNested(entity, self._nestedArrays);
            }

            /*******************
             * fireBaseRef Mngt
             * *******************/

            function getCurrentPath() {
                return self._pathMaster.path();
            }

            function getCurrentRef() {
                return self._pathMaster.ref();
            }

            function getCurrentBase() {
                return self._pathMaster.base();
            }


            /**
             * @public
             * @return{Promise<Object>} - promise resolves to firebaseRef at the main node(ie rootPath/self._path)
             */

            function mainRef() {
                return self._pathMaster.main();
            }

            /**
             * @public
             * @return{Promise<Array>} - promise resolves to a $firebaseArray of the main node
             */

            function mainArray() {
                return self._pathMaster.mainArray();
            }

            /**
             * @public
             * @param{String} id - key of record you wish to retrieve
             * @return{Promise<Object>} - promise resolves to a $firebaseObject of the given main record
             */

            function mainRecord(id) {
                return self._pathMaster.mainRecord(id);
            }

            /**
             * @private
             * access nestedArrays in the constructor via the 'nestedArrays' option
             */

            function nestedArray(id, name) {
                return self._pathMaster.nestedArray(id, name);
            }

            function nestedArrayRef(id, name) {
                return self._pathMaster.nestedArrayRef(id, name);
            }

            function indexAf(id, name, type) {
                return self._pathMaster.indexAf(id, name, type);
            }

            function nestedRecord(mainId, name, recId) {
                return self._pathMaster.nestedRecord(mainId, name, recId);
            }

            function buildFire(type, path, flag) {
                return self._pathMaster.buildFire(type, path, flag);
            }

            /* Geofire Interface */

            /**
             * @public if 'option.geofire' === true
             * @param{String} path - child node of geofire node
             * @return{Promise<Object>} - promise resolves to a geofire object
             *
             */

            function makeGeofire(path) {
                return self._pathMaster.makeGeofire(path);
            }

            /*****************
             * Main Methods
             * ***************/

            /*Queries*/

            /**
             * @public
             * @param{String} recId - id of main record
             * @param{String} arrName - name of index
             * @return{Array} ["keys","presently","in" "index"]
             */

            function getIndexKeys(recId, arrName) {
                return indexAf(recId, arrName, "array")
                    .then(loaded)
                    .then(getKeys)
                    .catch(standardError);

                function getKeys(res) {

                    var arr = [];
                    self._q.all(res.map(function(item) {
                        arr.push(item.$id);
                    }));
                    return arr;
                }
            }

            /**
             * @public
             * @param{String} [id] - key of main record you wish to load; without id argument fn will load entire main array
             * @return{Promise<Object|Array>}  - promise resolves to a $firebaseObject or $firebaseArray
             */

            function load(id) {
                switch (angular.isUndefined(id)) {
                    case true:
                        return loadMainArray();
                    case false:
                        return loadMainRecord(id);
                }
            }

            /**
             * @private
             */
            function loadMainArray() {
                return mainArray()
                    .then(loaded)
                    .catch(standardError);
            }

            /**
             * @private
             */
            function loadMainRecord(id) {
                return mainRecord(id)
                    .then(loaded)
                    .catch(standardError);
            }



            /**
             * @public
             * @param{String|Array} param - either "key" or [$firebaseArray,"key"]
             * @return{Promise<Object>}  - promise resolves to the given $firebaseArray record
             */

            function getMainRecord(param) {
                switch (angular.isArray(param)) {
                    case true:
                        return getRecord(param);
                    case false:
                        switch (angular.isString(param)) {
                            case true:
                                return loadArrayAndGet(param);
                            case false:
                                return standardError("Invalid type:  must pass an array or string");

                        }
                }
            }


            /**
             * @public
             * @param{String} col - property name used in an 'orderByChild' query;
             * @param{String|Number|etc} val - value of child - ie arg of equalTo
             * @return{Promise<Array>} promise resolves to a $firebaseArray of the given query
             */
            function queryByChild(col, val) {
                return qAll(mainRef(), [col, val])
                    .then(completeQuery)
                    .catch(standardError);

                function completeQuery(res) {
                    return res[0].orderByChild(res[1][0]).equalTo(res[1][1]);
                }
            }

            /* Commands */

            /**
             * @public
             * @param{String} recId - key of main record - you can leave it undefined if you've
             * configured option hash to use your app's session object
             * @param{String} idxName - name of index
             * @param{String} key  - foreign key to add to index
             * @return{Promise<Object>} promise resolves to the firebaseRef of the index
             */

            function addIndex(recId, idxName, key) {

                if (!angular.isString(recId) && self._session === true) {
                    recId = sessionId();
                }
                return qAll(nestedArrayRef(recId, idxName), key)
                    .then(completeAction)
                    .catch(standardError);

                function completeAction(res) {
                    return self._timeout(function() {
                            return qAll(res[0], res[0].child(res[1]).set(true))
                        })
                        .then(setReturnValueToFirst)
                        .catch(standardError);
                }
            }

            /**
             * @public
             * @param{String} recId - key of main record - you can leave it undefined if you've
             * configured option hash to use your app's session object
             * @param{String} idxName - name of index
             * @param{String} key  - foreign key to remove from  index
             * @return{Promise<Object>} promise resolves to the firebaseRef of the index
             */

            function removeIndex(recId, idxName, key) {

                if (!angular.isString(recId) && self._session === true) {
                    recId = sessionId();
                }

                return qAll(nestedArrayRef(recId, idxName), key)
                    .then(completeAction)
                    .catch(standardError);

                function completeAction(res) {
                    return self._timeout(function() {
                            return qAll(res[0], res[0].child(res[1]).set(null))
                        })
                        .then(setReturnValueToFirst)
                        .catch(standardError);
                }
            }

            /**
             * @public
             * @param{String|Object} id either key of main record or the actual $firebaseObject
             * @param{Object} scope - $scope
             * @param{String} varName - variable name to bind object
             * @return{Promise<Object>}
             */

            function bindTo(id, scope, varName) {
                switch (angular.isString(id)) {
                    case true:
                        return qAll(mainRecord(id), [scope, varName])
                            .then(bindObject)
                            .catch(standardError)
                    case false:
                        return qAll(id, [scope, varName])
                            .then(bindObject)
                            .catch(standardError);
                }

            }

            /**
             * @public
             * @param{Object} data - data object to persist to main array
             * @return{Promise<Object>} firebaseRef of newly added record
             */

            function basicAdd(data) {
                return qAll(mainArray(), data)
                    .then(add)
                    .catch(standardError);
            }


            /**
             * @private
             */

            function createMainRecord(data, flag) {
                if (flag === true && self._user === true) {
                    data[self._uidProperty] = sessionId();
                }

                if (flag === true && self._geofire === true) {
                    delete data[self._latitude]
                    delete data[self._longitude]
                }
                return qAll(mainArray(), data)
                    .then(add)
                    .catch(standardError);
            }

            /**
             * @public
             * @param{String|Object|Array} param - pass the key, the $firebaseObject, or [$firebaseArray,record]
             * @return{Promise<Object>} - promise resolves to the firebaseRef of the removed record
             */

            function removeMainRecord(param) {

                switch (angular.isString(param)) {
                    case true:
                        return mainRecord(param)
                            .then(remove);
                    default:
                        return remove(param);
                }

            }


            /************
             * GPS Option
             * ***********/

            /** 
             * @public if options.gps === true
             * @param{Object} obj
             *
             * @param{Object|Array} obj.data locations to save
             * @param{String} [obj.path=self._points] child node for coordinates
             * @param{Object|String} [obj.id] if the main record already exists pass its firebaseRef or key and method will
             * add indexes
             * @return{Promise<Array>} promise resovles to an array of newly created location records or to location indexes
             */

            function sendToGeofireToAdd(obj) {
                if (!obj.path) {
                    obj.path = self._points;
                }
                switch (!obj.id) {
                    case true:
                        return self._geofireObject.add(obj.data, obj.path);
                    default:
                        return self._geofireObject.add(obj.data, obj.path)
                            .then(setReturnVal)
                            .then(addLocationIndices)
                            .catch(standardError);
                }

                function setReturnVal(res) {
                    var arr = []
                    arr.push(obj.id);
                    arr.push(res);
                    return arr;
                }
            }



            /**
             * @public if options.gps === true
             * @param{Object} obj
             * @param{String} obj.id "mainRecordId"
             * @param{Boolean} [obj.flag=null] true if only wish to remove coordinates, otherwise leave undefined
             * @param{String} [obj.path=self._points] child node for coordinates
             * @param{Array<String>} [obj.locKeys] ["array","or","locationIds"] - optional
             * @return{Promise<Array>} [fireBaseRefs of removed main location records]
             */

            function sendToGeofireToRemove(obj) {
                if (!obj.path) {
                    obj.path = self._points;
                }
                if (!obj.flag) {
                    obj.flag = null;
                }
                switch (!obj.locKeys) {
                    case true:
                        return getIndexKeys(obj.id, self._geofireIndex)
                            .then(completeRemove)
                    default:
                        return completeRemove(obj.locKeys)
                            .then(removeLocIndices)
                }

                function completeRemove(res) {
                    return self._geofireObject.remove(res, obj.flag, obj.path);
                }

                function removeLocIndices(res) {
                    return self._q.all(res.map(function(loc) {
                        return removeIndex(obj.id, self._geofireIndex, loc.key());

                    }));
                }

            }

            /**
             * @private
             */

            function addKeyToLocation(locKey, fKey) {
                switch (self._addRecordKey) {
                    case true:
                        return self._geofireObject.addRecordKey(self._points, locKey, fKey);
                    default:
                        null;
                }
            }

            /**
             * @public - if options.gps === true
             * @param{String} col - property name to query by
             * @param{String} id - key of record that you want to load locations of
             * @return{Promise<Array>}  - promise resolves to a $firebaseArray
             * @summary load all locations associates with a given main record
             *
             */
            function sendToGeoFireToLoadLocations(col, id) {
                return self._geofireObject.loadRecordLocations(col, id);
            }

            /**
             * @public - if options.gps === true
             * @param{String} key - record id
             * @param{Array} coords - [latitude,longitude]
             * @param{String} [pth=self._points] - name of child node to save coordinates at.
             * This defaults to name of the main node
             * @return{Promise<Object>} resolves to the firebaseRef of entire geofire node
             */

            function setCoords(key, coords, pth) {
                if (!pth) {
                    pth = self._points;
                }
                return self._geofireObject.set(key, coords, pth);
            }


            /**
             * @public - if options.gps === true
             * @param{String} key - id to lookup
             * @param{String} [pth=self._points] - name of child node to save coordinates at.
             * This defaults to name of the main node
             * @return{Promise<Array|Null>} resolves to the coordinates array or null if no record
             * is found
             */

            function getCoords(key, pth) {
                if (!pth) {
                    pth = self._points;
                }
                return self._geofireObject.get(key, pth);
            }

            /**
             * @public - if options.gps === true
             * @param{String} key - id to lookup
             * @param{String} [pth=self._points] - name of child node to save coordinates at.
             * This defaults to name of the main node
             * @return{Promise<Object>} resolves to the firebaseRef of entire geofire node
             *
             */

            function removeCoords(key, pth) {
                if (!pth) {
                    pth = self._points;
                }
                return self._geofireObject.remove(key, true, pth);
            }


            /**
             * @public - if options.gps === true
             * @param{Object} obj
             * @param{Number} obj.radius - radius of query
             * @param{Array<Number>} obj.center - [latitude,longitude]
             * @param{String} [pth=self._points] - name of child node to save coordinates at.
             * Defaults to name of main node
             * @return{Promise<Object>} geoquery object
             */


            function geoQuery(obj, pth) {
                if (!pth) {
                    pth = self._points;
                }
                return self._geofireObject.query(obj, pth);
            }

            /*****************
             * Geofire Option
             * ***************/

            /**
             * @public - if options.geofire === true
             * @param{Object|Array<Object>} locs - either data object to add or [data,objects,to,add]
             * @param{String} [path=self._points] - name of child node for coordinates.  defaults
             * to name of main node
             * @return{Array} firebaseRefs of newly created main location Array records
             */

            function addLocations(locs, path) {
                if (!angular.isArray(locs)) {
                    locs = [locs];
                }

                return self._q.all(locs.map(function(loc) {
                    return addFullLocationRecord(loc, path)
                        .catch(standardError);
                }));
            }

            /**
             * @public - if options.geofire === true
             * @param{String|Array<String>} keys -either key - if only one record or ["keys","of","records"]
             * @param{Boolean} flag true if only wish to remove  coordinates, otherwise leave undefined
             * @return{Array} firebaseRefs of deleted record
             */

            function removeLocations(keys, flag, path) {
                if (!angular.isArray(keys)) {
                    keys = [keys];
                }

                return self._q.all(keys.map(function(key) {
                    return removeLocation(key, flag, path)
                        .catch(standardError);
                }));
            }


            /**
             * @private
             */

            function removeLocation(key, flag, path) {
                switch (flag) {
                    case true:
                        return removeGeofire(key, path)
                    default:
                        return removeFullLocationRecord(key, path)
                }

            }

            /**
             * @public - if option.geofire === true
             * @param{String} col - property name to query by
             * @param{String} id - key of record that you want to load locations of
             * @return{Promise<Array>}  - promise resolves to a $firebaseArray
             * @summary load all locations associates with a given main record
             */

            function loadRecordLocations(col, id) {
                return currentRecordLocations(col, id)
                    .then(wrapQuery)
                    .then(loaded)
                    .catch(standardError);
            }

            /**
             * @private
             */
            function addFullLocationRecord(data, path) {
                var coords = {
                    lat: data[self._latitude],
                    lon: data[self._longitude]
                };

                return qAll(createMainRecord(data, true), coords)
                    .then(setAndPass)
                    .then(setReturnValueToSecond)
                    .catch(standardError);

                function setAndPass(res) {
                    return qAll(setGeofire(res[0].key(), [res[1].lat, res[1].lon], path), res[0]);
                }

            }

            /**
             * @private
             */
            function removeFullLocationRecord(key, path) {
                return self._q.all([removeMainRecord(key), removeGeofire(key, path)])
                    .then(setReturnValueToFirst)
                    .catch(standardError);
            }


            /**
             * @public - if options.geofire === true
             * @param{String} key - id to lookup
             * @param{String} - name of child node to save coordinates at.
             * @return{Promise<Array|Null>} resolves to the coordinates array or null if no record
             * is found
             */

            function getGeofire(key, path) {
                return qAll(makeGeofire(path), key)
                    .then(getGeo)
                    .catch(standardError);
            }

            /**
             * @public - if options.geofire === true
             * @param{Object} obj
             * @param{Number} obj.radius - radius of query
             * @param{Array<Number>} obj.center - [latitude,longitude]
             * @param{String} - name of child node to save coordinates at.
             * @return{Promise<Object>} geoquery object
             */

            function queryGeofire(data, path) {
                return qAll(makeGeofire(path), data)
                    .then(queryGeo)
                    .catch(standardError);
            }

            /**
             * @public - if options.geofire === true
             * @param{String} key - id to lookup
             * @param{String} - name of child node to save coordinates at.
             * @return{Promise<Object>} resolves to the firebaseRef of entire geofire node
             *
             */

            function removeGeofire(key, path) {
                return qAll(makeGeofire(path), key)
                    .then(removeGeo)
                    .catch(standardError);
            }

            /**
             * @public - if options.geofire === true
             * @param{String} key - record id
             * @param{Array} coords - [latitude,longitude]
             * @param{String} path of child node to save coordinates at.
             * @return{Promise<Object>} resolves to the firebaseRef of entire geofire node
             */

            function setGeofire(key, coords, path) {
                return qAll(makeGeofire(path), [key, coords])
                    .then(setGeo)
                    .catch(standardError);
            }

            /**
             * @public - if options.geofire === true
             * @param{String} path - key in geofire services' foreignKey's object used to identify
             * this record's property name - see discussion in README
             * @param{String} locKey - id of location record to lookup
             * @param{String} mainRecId - id of main record to persist to the associated locations
             * @summary this method adds a "mainRec" property to any locations added - the actual
             * name of the property is determined in the constructor's foreignKeys option.  The value stored
             * is the main Record Id
             */
            function addRecordKey(path, locKey, mainRecId) {
                var prop = self._foreignKeys[path];
                switch (!angular.isString(prop)) {
                    case true:
                        throw new Error("Invalid key: Please check options defined for your Geofire service");
                    case false:
                        return mainRef()
                            .then(updateLocationRecord)
                            .catch(standardError);
                }

                function updateLocationRecord(res) {
                    return self._timeout(function() {
                        var obj = {};
                        obj[prop] = mainRecId;
                        return res.child(locKey).update(obj);
                    });
                }
            }


            /*************
             * User Option
             * ************/

            /** 
             * @private
             */

            function addUserIndex(key) {
                return self._userObject
                    .addIndex(null, self._path, key);
            }

            /** 
             * @private
             */

            function removeUserIndex(key) {
                return self._userObject
                    .removeIndex(null, self._path, key);
            }

            /**
             * @public - if option.user === true
             * @return{Promise<Array>}  - promise resolves to a $firebaseArray
             * @summary load all main records associated with current User
             */

            function loadUserRecords() {
                return currentUserRecords()
                    .then(wrapQuery)
                    .then(loaded)
                    .catch(standardError);
            }

            /****************
             * Session Option
             * ***************/

            /**
             * @public if options.session === true
             * @param{Object} s - $scope object
             * @param{String} v - variable name to bind to
             * @summary - this is a helper method to bind the current record to the $scope object
             */

            function bindCurrent(s, v) {
                return bindTo(sessionId(), s, v);
            }

            /**
             * @public if options.session === true
             * @return{Promise<Object>} -promise resolves to a $firebaseObject of the current record
             */

            function current() {
                return mainRecord(sessionId());
            }

            /**
             * @public if options.session === true
             * @return{Object} - returns your app's session service
             */
            function session() {
                return self._sessionObject;
            }

            /**
             * @public if options.session === true
             * @return{String} - returns the current record id
             */

            function sessionId() {
                return self._sessionObject[self._sessionIdMethod]();
            }

            /*********************************/

            /*
             * Combo Methods */

            /** 
             * @public if options.user === true
             * @param{Object} data to save to user array - just saving key for now
             * @return{Array} [Promise(fireBaseRef at userIndex), firebaseRef(main record created)]
             * @summary save main record and to user index
             */

            function createWithUser(data) {
                return createMainRecord(data, self._uid)
                    .then(passKeyToUser)
                    .catch(standardError);

                function passKeyToUser(res) {
                    return qAll(addUserIndex(res.key()), res);
                }

            }


            /** 
             * @public if options.user === true
             * @param{String|Array}  key of main record to remove or [fireBaseArray,record to remove]
             * @return{Array<Promise>} [Promise(fireBaseRef at userIndex), firebaseRef(main record removed)]
             * @summary remove main record and user index
             */

            function removeWithUser(key) {
                return removeMainRecord(key)
                    .then(passKeyToUser)
                    .catch(standardError);

                function passKeyToUser(res) {
                    return qAll(removeUserIndex(res.key()), res);
                }

            }

            /**
             * @public if options.gps ===true
             * @param{Object} rec - data object to persist to main Array
             * @param{Object|Array<Object>} loc - location object associated with record or
             * [locations,associated,with,record]
             * @return{Promise<Object>} promise resolves to firebaseRef of newly created main record
             * @summary This method creates a main record and records of associated locations. It also
             * adds a location index to the main record and adds the main records key to the location
             * records.
             */

            function createWithGps(rec, loc) {
                return self._q.all([createMainRecord(rec), sendToGeofireToAdd({
                        data: loc
                    })])
                    .then(addLocationIndexAndPassKey)
                    .then(setReturnValueToSecond)
                    .catch(standardError);

                function addLocationIndexAndPassKey(res) {
                    return qAll(addLocationIndices(res), res[0]);
                }

            }

            /**
             * @param{Array} arr
             * @param{Object|String} arr[0] firebaseRef or key of Record that has the associated location data
             * @param{Array} arr[1] array of firebaseRef of newly persisted locations
             * @return{Promise<Array>} array of location index, firebaseRef of location record
             * @summary creates indexes of persisted locations and, unless you've opted out of 'addRecordKey option
             * this will add this record key to the location record as well
             *
             */

            function addLocationIndices(arr) {
                if (!angular.isString(arr[0])) {
                    arr[0] = arr[0].key();
                }
                return self._q.all(arr[1].map(function(loc) {

                    return qAll(addIndex(arr[0], self._geofireIndex, loc.key()), addKeyToLocation(loc.key(), arr[0]));
                }));
            }

            /**
             * @public if options.gps ===true
             * @param{String} recId - id of main record
             * @return{Promise<Object>} promise resolves to firebaseRef of the removed main record
             * @summary This method removes a main record and any assocated locations
             */

            function removeWithGps(recId) {

                return qAll(sendToGeofireToRemove({
                        id: recId
                    }), recId)
                    .then(removeMainRec)
                    .catch(standardError);

                function removeMainRec(res) {
                    return removeMainRecord(res[1]);
                }
            }

            /** 
             * @public if options.user === true && options.gps === true
             * @param{Object} rec to save to main array
             * @param{Object|Array} loc location data to persist- or [locations,to,persist]
             * @return{Promise<Object>} - Promise resolves to the firebaseRef of the newly created main record
             * @summary - This method adds a main record and records for any locations passed.  It also
             * adds a location index at the main record, adds main record Id to each location record, and
             * adds an index in the current user's firebase node.
             */

            function createWithUserAndGps(rec, loc) {

                return self._q.all([createWithUser(rec), sendToGeofireToAdd({
                        data: loc
                    })])
                    .then(addLocationIndexAndPassKey)
                    .then(setReturnValueToSecond)
                    .catch(standardError);

                function addLocationIndexAndPassKey(res) {
                    /*mainkey,geofire Obj*/
                    return self._q.all([addLocationIndices([res[0][1], res[1]]), res[0][1]]);
                }

            }

            /**
             * @public if options.gps === true
						 * @param{String} id key of location record to retrieve
						 * @return{Promise<Object|Null>} - Promise resolves to the array record or null if not found
             */

            function getLocationRecord(id) {
                return self._geofireObject
                    .mainRecord(id)
            }

            /** 
						 * @public if options.user === true && options.gps === true
						 * @param{String} mainRecId - key of main record to remove
             * @param{Promise<Object>} - Promise resolves to the firebaseRef of the removed main record
             *
             */

            function removeWithUserAndGps(mainRecId) {

                return qAll(sendToGeofireToRemove({
                        id: mainRecId
                    }), mainRecId)
                    .then(removeMainRec)
                    .catch(standardError);


                function removeMainRec(res) {
                    return removeWithUser(res[1]);
                }
            }


            /** 
						 * @constructor
						 * @public if options.nestedArrays is defined
             */

            function addNested(obj, arr) {
                var newProperties = {};

                self._q.all(arr.map(function(item) {
                    angular.extend(newProperties, addNestedArray(obj, item));
                }));

                return angular.merge({}, obj, newProperties);
            }

            function addNestedArray(obj, arr) {
                var arrName, recName, addRec, getRec, removeRec, loadRec, loadRecs, saveRec, newProp;
                arrName = self._utils.pluralize(arr);
                recName = self._utils.singularize(arr);
                addRec = "add" + self._utils.camelize(recName, true);
                getRec = "get" + self._utils.camelize(recName, true);
                removeRec = "remove" + self._utils.camelize(recName, true);
                loadRec = "load" + self._utils.camelize(recName, true);
                loadRecs = "load" + self._utils.camelize(arrName, true);
                saveRec = "save" + self._utils.camelize(recName, true);
                newProp = {};

                newProp[arrName] = function(id) {
                    if (self._session === true && !id) {
                        id = sessionId();
                    }
                    return nestedArray(id, arrName);
                };

                newProp[recName] = function(nestedRecId, id) {
                    if (self._session === true && !id) {
                        id = sessionId();
                    }
                    if (!nestedRecId) {
                        throw new Error("You must provide a record id");
                    } else {
                        return nestedRecord(id, arrName, nestedRecId);
                    }
                };

                newProp[addRec] = function(data, id) {
                    return qAll(newProp[arrName](id), data)
                        .then(add)
                        .catch(standardError);
                };

                newProp[getRec] = function(key, id) {

                    return qAll(newProp[arrName](id), key)
                        .then(getRecord)
                        .catch(standardError);
                };

                newProp[removeRec] = function(key, id) {
                    return newProp[recName](key, id)
                        .then(remove)
                        .catch(standardError);
                };
                newProp[loadRec] = function(id, idxOrRec) {
                    return newProp[recName](id, idxOrRec)
                        .then(loaded)
                        .catch(standardError);
                };

                newProp[loadRecs] = function(id) {
                    return newProp[arrName](id)
                        .then(loaded)
                        .catch(standardError);
                };

                newProp[saveRec] = function(rec, id) {
                    switch (angular.isArray(rec)) {
                        case true:
                            return save(rec)
                                .catch(standardError);
                        case false:
                            return qAll(newProp[arrName](id), rec)
                                .then(save)
                                .catch(standardError);
                    }

                };

                return newProp;
            }


            /**
             * @private
             */

            function add(res) {
                return res[0].$add(checkTimeStampAtCreate(res[1]));
            }

            /**
             * @private
             */
            function remove(res) {
                switch (angular.isArray(res)) {
                    case true:
                        return res[0].$remove(res[1])
                            .catch(standardError);
                    default:
                        return res.$remove()
                            .catch(standardError);
                }
            }

            /**
             * @private
             */
            function save(res) {
                switch (angular.isArray(res)) {
                    /* to save array record */
                    case true:
                        return saveArray(res)
                            .catch(standardError);
                        /* to save object */
                    case false:
                        res = checkTimeStampAtSave(res)
                        return res.$save()
                            .catch(standardError);
                }
            }

            /**
             * @private
             */
            function saveArray(params) {
                switch (angular.isNumber(params[1])) {
                    case true:
                        switch (self._timeStamp) {
                            case true:
                                return qAll(params[0], getRecord([params[0], keyAt(params)]))
                                    .then(updateTime);
                            default:
                                return params[0].$save(params[1]);
                        }
                        break;
                    default:
                        return updateTime(params);
                }

                function updateTime(res) {
                    return res[0].$save(checkTimeStampAtSave(res[1]));
                }

            }


            /**
             * @private
             */
            function getRecord(res) {
                return res[0].$getRecord(res[1]);
            }

            /**
             * @private
             */
            function loadArrayAndGet(key) {
                return qAll(loadMainArray(), key)
                    .then(getRecord)
                    .catch(standardError);
            }

            /**
             * @private
             */
            function keyAt(res) {
                return res[0].$keyAt(res[1]);
            }

            /**
             * @private
             */
            function bindObject(res) {
                return res[0].$bindTo(res[1][0], res[1][1]);
            }

            /**
             * @private
             */
            function loaded(res) {
                return res.$loaded();
            }

            /**
             * @private
             */
            function getGeo(res) {
                return qAll(res[0], res[0].get(res[1]));
            }

            /**
             * @private
             */
            function setGeo(res) {
                return res[0].set(res[1][0], res[1][1]);
            }

            /**
             * @private
             */
            function queryGeo(res) {
                return qAll(res[0], res[0].query(res[1]));
            }

            /**
             * @private
             */
            function removeGeo(res) {
                return res[0].remove(res[1]);
            }

            /**
             * @private
             */
            function setReturnValueToFirst(res) {
                return self._timeout(function() {
                    return res[0];
                });
            }

            /**
             * @private
             */
            function currentRecordLocations(prop, id) {
                return queryByChild(prop, id);
            }

            /**
             * @private
             */
            function currentUserRecords() {
                return queryByChild(self._uidProperty, sessionId());
            }

            /**
             * @private
             */
            function setReturnValueToSecond(res) {
                return self._timeout(function() {
                    return res[1];
                });
            }

            /**
             * @private
             */
            function wrapQuery(res) {
                return buildFire("array", res, true);
            }


            /**
             * @private
             */
            function checkTimeStampAtCreate(obj) {
                switch (self._timeStamp) {
                    case true:
                        return self._utils.addTimeAtCreate(obj, self._createTime, self._updateTime);
                    default:
                        return obj;
                }
            }

            /**
             * @private
             */
            function checkTimeStampAtSave(obj) {
                switch (self._timeStamp) {
                    case true:
                        return self._utils.addTimeAtSave(obj, self._updateTime);
                    default:
                        return obj;
                }
            }

            /**
             * @private
             */
            function qAll(x, y) {
                return self._utils.qAll(x, y);
            }

            /**
             * @private
             */
            function standardError(err) {
                return self._utils.standardError(err);
            }

            /**
             * @public
             */
            function inspect(item) {
                switch (!item) {
                    case true:
                        return self;
                    case false:
                        item = "_" + item;
                        return self[item];
                }
            }

            self._entity = entity;
            return self._entity;
        }
    };
}.call(this));
