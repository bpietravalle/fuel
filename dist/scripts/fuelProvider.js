(function() {
    'use strict';

    angular
        .module('firebase.fuel', ['firebase.fuel.config', 'firebase.fuel.services']);

    angular
        .module('firebase.fuel.services', ['firebase.fuel.utils','firebase.fuel.logger', 'firebase.fuel.config']);

})();

(function() {
  'use strict';

  angular
    .module('firebase.fuel')
    .config(config);

  /** @ngInject */
  function config($logProvider) {

    $logProvider.debugEnabled(true);

  }

})();

(function() {
    "use strict";

    angular.module('firebase.fuel.config', ['firebase.starter'])

    .provider('fuelConfiguration', FuelConfigProvider);

    function FuelConfigProvider(fireStarterProvider) {
        var prov = this;
        prov.setRoot = function(val) {
            fireStarterProvider.setRoot(val);
        }
        prov.getRoot = function() {
            return fireStarterProvider.getRoot();
        }

        prov.$get = ["fireStarter",
            function(fireStarter) {
                switch (angular.isString(prov.getRoot())) {
                    case true:
                        return function(type, path, options) {
                            return fireStarter(type, path, options)
                        };
                    case false:
                        throw new Error("You must define a root url in your module's config block");
                }
            }
        ];
    }


})();

(function() {
    "use strict";
    var Fuel;
    angular
        .module('firebase.fuel.services')
        .provider("fuel", FuelProvider);

    function FuelProvider() {
        var prov = this;

        prov.$get = ["$timeout", "utils", "firePath", "$q", "$log", "$injector",
            function FuelFactory($timeout, utils, firePath, $q, $log, $injector) {

                return function(path, options) {
                    var fb = new Fuel($timeout, utils, firePath, $q, $log, $injector, path, options);
                    return fb.construct();
                };
            }
        ];

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
                this._pathOptions.geofireNode = this._geofireNode;
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

                this._pathOptions.session = true;
                this._pathOptions.sessionService = this._sessionService;
                this._pathOptions.sessionIdMethod = this._sessionIdMethod;
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

                /* fireBaseRef Mngt */
                entity.base = getCurrentBase;
                entity.ref = getCurrentRef;
                entity.path = getCurrentPath;
                entity.parent = getCurrentParentRef;
                entity.pathHistory = getPathHistory;
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
                entity.save = saveMaster;
                entity.addIndex = addIndex;
                entity.removeIndex = removeIndex;

                if (self._user !== true && self._gps !== true && self._geofire !== true) {
                    entity.add = createMainRecord;
                    entity.remove = removeMainRecord;
                }

                if (self._user === true) {
                    entity.loadUserRecords = loadUserRecords;
                }

                if (self._gps === true) {
                    entity.getLocation = getLocationRecord;
                    entity.createLocation = sendToGeofireToAdd;
                    entity.removeLocation = sendToGeofireForRemoval;

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
                    // entity.saveCurrent = saveCurrent;
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

                function getCurrentParentRef() {
                    return self._pathMaster.parent();
                }

                function getCurrentBase() {
                    return self._pathMaster.base();
                }

                function getPathHistory() {
                    return self._pathMaster.pathHistory();
                }

                /******************************/

                function mainRef() {
                    return self._pathMaster.main();
                }

                function mainArray() {
                    return self._pathMaster.mainArray();
                }

                function mainRecord(id) {
                    return self._pathMaster.mainRecord(id);
                }

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

                //TODO make private
                function buildFire(type, path, flag) {
                    return self._pathMaster.buildFire(type, path, flag);
                }

                /* Geofire Interface */

                function makeGeofire(path) {
                    return self._pathMaster.makeGeofire(path);
                }

                /*****************
                 * Main Methods
                 * ***************/

                /*Queries*/

                function getIndexKeys(recId, arrName) {
                    return indexAf(recId, arrName, "array")
                        .then(getKeys)
                        .then(setReturnValue)
                        .catch(standardError);

                    function getKeys(res) {
                        return qAll(res.$loaded(), []);
                    }

                    function setReturnValue(res) {
                        self._q.all(res[0].map(function(item) {
                            res[1].push(item.$id);
                        }));
                        return res[1];
                    }
                }

                function load(id) {
                    if (angular.isUndefined(id)) {
                        return loadMainArray();
                    } else {
                        return loadMainRecord(id);
                    }
                }

                function loadMainArray() {
                    return mainArray()
                        .then(loaded)
                        .then(querySuccess)
                        .catch(standardError);
                }

                function loadMainRecord(id) {
                    return mainRecord(id)
                        .then(loaded)
                        .then(querySuccess)
                        .catch(standardError);
                }

                //TODO: spec without spies
                function loadUserRecords() {
                    return currentUserRecords()
                        .then(wrapQuery)
                        .then(loaded)
                        .catch(standardError);
                }

                function loadRecordLocations(prop, id) {
                    return currentRecordLocations(prop, id)
                        .then(wrapQuery)
                        .then(loaded)
                        .catch(standardError);
                }

                function getMainRecord(key) {
                    return qAll(loadMainArray(), key)
                        .then(getRecord)
                        .then(querySuccess)
                        .catch(standardError);

                }

                function currentRecordLocations(prop, id) {
                    return queryByChild(prop, id);
                }

                function currentUserRecords() {
                    return queryByChild(self._uidProperty, sessionId());
                }

                function queryByChild(key, val) {
                    return qAll(mainRef(), [key, val])
                        .then(completeQuery)
                        .catch(standardError);

                    function completeQuery(res) {
                        return res[0].orderByChild(res[1][0]).equalTo(res[1][1]);
                    }

                }

                /* Commands */
                function addIndex(recId, arrName, key) {

                    if (!angular.isString(recId) && self._session === true) {
                        recId = sessionId();
                    }
                    return qAll(nestedArrayRef(recId, arrName), key)
                        .then(completeAction)
                        .catch(standardError);

                    function completeAction(res) {
                        return self._timeout(function() {
                                return res[0].child(res[1]).set(true);
                            })
                            .then(function() {
                                return res[0];
                            })
                            .catch(standardError);
                    }
                }

                function removeIndex(recId, arrName, key) {

                    if (!angular.isString(recId) && self._session === true) {
                        recId = sessionId();
                    }

                    return qAll(nestedArrayRef(recId, arrName), key)
                        .then(completeAction)
                        .catch(standardError);

                    function completeAction(res) {
                        return self._timeout(function() {
                                return res[0].child(res[1]).set(null);
                            })
                            .then(function() {
                                return res[0];
                            })
                            .catch(standardError);
                    }
                }

                /* @param{string} id of current record
                 * @param{string} index name
                 * @return{array} of index keys;
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
                        .then(commandSuccess)
                        .catch(standardError);
                }

                function removeMainRecord(key) {

                    return checkParam(key)
                        .then(commandSuccess)
                        .catch(standardError);

                    function checkParam(param) {
                        if (angular.isString(param)) {
                            return mainRecord(key)
                                .then(remove);
                        } else {
                            return remove(key);
                        }
                    }

                }

                function saveMaster(keyIdxorRec) {
                    return save(keyIdxorRec)
                        .then(commandSuccess)
                        .catch(standardError);
                }

                /************
                 * GPS Option
                 * ***********/

                /* @param{Object|Array} location data to save
                 * @param{Boolean} true if only wish to save coordinates, otherwise leave undefined
                 * @return{Array} [fireBaseRef of mainlocation]
                 */

                function sendToGeofireToAdd(locs, flag, path) {
                    return self._geofireObject.add(locs, flag, path);
                }

                /* @param{Object|Array} keys of records to remove
                 * @param{Boolean} true if only wish to remove coordinates, otherwise leave undefined
                 * @return{Array} [fireBaseRefs of removed main records]
                 */

                function sendToGeofireForRemoval(mainRecId, flag, path) {
                    return getIndexKeys(mainRecId, self._geofireIndex)
                        .then(completeRemove);

                    function completeRemove(res) {
                        return self._geofireObject.remove(res, flag, path);
                    }

                }


                function addKeyToLocation(locKey, fKey) {
                    switch (self._addRecordKey) {
                        case true:
                            return self._geofireObject.addRecordKey(self._path, locKey, fKey);
                        default:
                            null;
                    }
                }

                function sendToGeoFireToLoadLocations(prop, id) {
                    return self._geofireObject.loadRecordLocations(prop, id);
                }

                /*****************
                 * Geofire Option
                 * ***************/

                /* @param{Object|Array} 
                 * @param{Boolean} true if only wish to save coordinates, otherwise leave undefined
                 * @return{Array} firebaseRefs of created records
                 */

                function addLocations(locs, flag, path) {
                    if (!angular.isArray(locs)) {
                        locs = [locs];
                    }

                    return self._q.all(locs.map(function(loc) {
                        return addLocation(loc, flag, path);
                    }));
                }

                /* @param{Object|Array} 
                 * @param{Boolean} true if only wish to save coordinates, otherwise leave undefined
                 * @return{Array} firebaseRefs of deleted main array record
                 */

                function removeLocations(keys, flag, path) {
                    if (!angular.isArray(keys)) {
                        keys = [keys];
                    }

                    return self._q.all(keys.map(function(key) {
                        return removeLocation(key, flag, path);
                    }));
                }


                function addLocation(data, flag, path) {
                    switch (flag) {
                        case true:
                            return setGeofire(data[0], data[1], path)
                                .then(commandSuccess)
                                .catch(standardError);
                        default:
                            return addFullLocationRecord(data, path)
                                .then(commandSuccess)
                                .catch(standardError);
                    }
                }

                function removeLocation(key, flag, path) {
                    switch (flag) {
                        case true:
                            return removeGeofire(key, path)
                                .then(commandSuccess)
                                .catch(standardError);
                        default:
                            return removeFullLocationRecord(key, path)
                                .then(commandSuccess)
                                .catch(standardError);
                    }

                }

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

                function removeFullLocationRecord(key, path) {
                    return self._q.all([removeMainRecord(key), removeGeofire(key, path)])
                        .then(setReturnValueToFirst)
                        .catch(standardError);
                }


                function getGeofire(key, path) {
                    return qAll(makeGeofire(path), key)
                        .then(getGeo)
                        .then(querySuccess)
                        .catch(standardError);
                }

                function queryGeofire(data, path) {
                    return qAll(makeGeofire(path), data)
                        .then(queryGeo)
                        .then(querySuccess)
                        .catch(standardError);
                }

                function removeGeofire(key, path) {
                    return qAll(makeGeofire(path), key)
                        .then(removeGeo)
                        // .then(commandSuccess)
                        .catch(standardError);
                }

                function setGeofire(key, coords, path) {
                    return qAll(makeGeofire(path), [key, coords])
                        .then(setGeo)
                        // .then(commandSuccess)
                        .catch(standardError);
                }

                function addRecordKey(path, locKey, fKey) {
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
                            obj[prop] = fKey;
                            return res.child(locKey).update(obj);
                        });
                    }
                }


                /*************
                 * User Option
                 * ************/

                function addUserIndex(key) {
                    return self._userObject
                        .addIndex(null, self._path, key);
                }

                function removeUserIndex(key) {
                    return self._userObject
                        .removeIndex(null, self._path, key);
                }


                /****************
                 * Session Option
                 * ***************/

                function bindCurrent(s, v) {
                    return bindTo(sessionId(), s, v);
                }

                // function saveCurrent(data) {
                //     return qAll(current(), data)
                //         .then(save)
                //         .then(commandSuccess)
                //         .catch(standardError);
                // }

                function current() {
                    return mainRecord(sessionId());
                }

                function session() {
                    return self._sessionObject;
                }

                function sessionId() {
                    return self._sessionObject[self._sessionIdMethod]();
                }

                /*********************************/

                /*
                 * Combo Methods */

                /* save main record and to user index
                 * @param{Object} data to save to user array - just saving key for now
                 * @return{Array} [Promise(fireBaseRef at userIndex), firebaseRef(main record created)]
                 */

                function createWithUser(data) {
                    return createMainRecord(data, self._uid)
                        .then(passKeyToUser)
                        .catch(standardError);

                    function passKeyToUser(res) {
                        return qAll(addUserIndex(res.key()), res);
                    }

                }

                /* remove main record and user index
                 * @param{String|Array}  key of main record to remove or [fireBaseArray,record to remove]
                 * @return{Array} [Promise(fireBaseRef at userIndex), firebaseRef(main record removed)]
                 */

                function removeWithUser(key) {
                    return removeMainRecord(key)
                        .then(passKeyToUser)
                        .catch(standardError);

                    function passKeyToUser(res) {
                        return qAll(removeUserIndex(res.key()), res);
                    }

                    function setReturnValue(res) {
                        return res[1];
                    }
                }

                //TODO add method to update locationRecord with mainrecord id - see below;

                function createWithGps(data, loc) {
                    return self._q.all([createMainRecord(data), sendToGeofireToAdd(loc, null, self._points)])
                        .then(addLocationIndexAndPassKey)
                        .then(setReturnValue)
                        .then(commandSuccess)
                        .catch(standardError);

                    function addLocationIndexAndPassKey(res) {
                        return qAll(addLocationIndices(res), res[0]);
                    }

                    function setReturnValue(res) {
                        return res[1];
                    }
                }

                function addLocationIndices(res) {
                    return self._q.all(res[1].map(function(loc) {

                        return qAll(addIndex(res[0].key(), self._geofireIndex, loc.key()), addKeyToLocation(loc.key(), res[0].key()));
                    }));
                }

                function removeWithGps(mainRecId) {

                    return qAll(sendToGeofireForRemoval(mainRecId, null, self._points), mainRecId)
                        .then(removeMainRec)
                        .catch(standardError);

                    function removeMainRec(res) {
                        return removeMainRecord(res[1]);
                    }
                }

                /* @param{object} data to save to main array
                 * @param{object} location data to save
                 * @return{Array} [firebaseRef(location Index), firebaseRef of main record]
                 *
                 */

                //TODO add method to update locationRecord with mainrecord id - see below;
                function createWithUserAndGps(data, loc) {

                    return self._q.all([createWithUser(data), sendToGeofireToAdd(loc, null, self._path)])
                        .then(addLocationIndexAndPassKey)
                        .then(setReturnValue)
                        .then(commandSuccess)
                        .catch(standardError);

                    function addLocationIndexAndPassKey(res) {
                        /*mainkey,geofire Obj*/
                        return self._q.all([addLocationIndices([res[0][1], res[1]]), res[0][1]]);
                    }

                    function setReturnValue(res) {
                        return res[1];
                    }
                }

                function getLocationRecord(id) {
                    return self._geofireObject
                        .mainRecord(id)
                }

                function removeWithUserAndGps(mainRecId) {

                    return qAll(sendToGeofireForRemoval(mainRecId, null, self._path), mainRecId)
                        .then(removeMainRec)
                        .catch(standardError);


                    function removeMainRec(res) {
                        return removeWithUser(res[1]);
                    }
                }


                /*********************************/

                /* Nested Arrays constructor
                 */

                function addNested(obj, arr) {
                    var newProperties = {};

                    self._q.all(arr.map(function(item) {
                        angular.extend(newProperties, addNestedArray(obj, item));
                    }));

                    return angular.merge({}, obj, newProperties);
                }

                function addNestedArray(obj, arr) {
                    var arrName, recName, addRec, getRec, removeRec, loadRec, loadRecs, saveRec, saveRecs, newProp;
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
                            .then(commandSuccess)
                            .catch(standardError);
                    };

                    newProp[getRec] = function(key, id) {

                        return qAll(newProp[arrName](id), key)
                            .then(getRecord)
                            .then(querySuccess)
                            .catch(standardError);
                    };

                    newProp[removeRec] = function(key, id) {
                        return newProp[recName](key, id)
                            .then(remove)
                            .then(commandSuccess)
                            .catch(standardError);
                    };
                    newProp[loadRec] = function(id, idxOrRec) {
                        return newProp[recName](id, idxOrRec)
                            .then(loaded)
                            .then(querySuccess)
                            .catch(standardError);
                    };

                    newProp[loadRecs] = function(id) {
                        return newProp[arrName](id)
                            .then(loaded)
                            .then(querySuccess)
                            .catch(standardError);
                    };

                    newProp[saveRec] = function(rec) {
                        // can pass array as well
                        return saveMaster(rec);
                    };

                    return newProp;
                }


                /****************
                 **** Helpers ****/

                function add(res) {
                    return res[0].$add(checkTimeStampAtCreate(res[1]));
                }

                function remove(res) {
                    if (angular.isArray(res)) {
                        return res[0].$remove(res[1]);
                    } else {
                        return res.$remove();
                    }
                }

                function save(res) {
                    switch (angular.isArray(res)) {
                        /* to save array record */
                        case true:
                            return saveArray(res);
                            /* to save object */
                        case false:
                            return saveObject(res);
                    }
                }

                function saveArray(res) {
                    return checkParams(res)
                        .catch(standardError);

                    function checkParams(params) {
                        /* pass key */
                        switch (angular.isString(params[1])) {
                            case true:
                                switch (self._timeStamp) {
                                    case true:
                                        return getRecord(params)
                                            .then(updateTime)
                                            .catch(standardError);
                                    default:
                                        return qAll(params[0].$indexFor(params[1]), params[0])
                                            .then(completeSave)
                                            .catch(standardError);
                                }
                            case false:
                                /* pass idx */
                                switch (angular.isNumber(params[1])) {
                                    case true:
                                        switch (self._timeStamp) {
                                            case true:
                                                return getRecord(params)
                                                    .then(updateTime)
                                                    .catch(standardError);
                                            default:
                                                return params[0].$save(checkTimeStampAtSave(params[1]));
                                        }
                                        /* pass record */
                                    default:
                                        return params[0].$save(checkTimeStampAtSave(params[1]));
                                }

                        }

                    }

                    function updateTime(res) {
                        return res[0].$save(checkTimeStampAtSave(res[1]));
                    }

                    function completeSave(res) {
                        return res[1].$save(res[0]);
                    }
                }

                function saveObject(res) {
                    res = checkTimeStampAtSave(res)
                    return res.$save();
                }

                function getRecord(res) {
                    if (angular.isNumber(res[1])) {
                        res[1] = res[0].$keyAt(res[1]);
                    }
                    return qAll(res[0].$getRecord(res[1]), res[0])
                        .then(setReturnValue)
                        .catch(standardError);

                    function setReturnValue(res) {
                        return [res[1], res[0]];
                    }
                }

                function indexFor(res) {
                    return res[0].$indexFor(res[1]);
                }

                function keyAt(res) {
                    return res[0].$ketAt(res[1]);
                }

                function bindObject(res) {
                    return res[0].$bindTo(res[1][0], res[1][1]);
                }

                function loaded(res) {
                    return res.$loaded();
                }

                function getGeo(res) {
                    return qAll(res[0], res[0].get(res[1]));
                }

                function setGeo(res) {
                    return res[0].set(res[1][0], res[1][1]);
                }

                function queryGeo(res) {
                    return qAll(res[0], res[0].query(res[1]));
                }

                function removeGeo(res) {
                    return res[0].remove(res[1]);
                }

                function checkNestedParams(recId, arrName, flag) {
                    if (flag === true) {
                        return qWrap(entity[recId]());
                    } else {
                        return qWrap(nestedArray(recId, arrName));
                    }
                }

                function setReturnValueToFirst(res) {
                    return self._timeout(function() {
                        return res[0];
                    });
                }

                function setReturnValueToSecond(res) {
                    return self._timeout(function() {
                        return res[1];
                    });
                }

                function wrapQuery(res) {
                    return buildFire("array", res, true);
                }



                /**CQ*****************************/

                function commandSuccess(res) {
                    // self._log.info('command success');
                    // self._log.info(res);
                    switch (angular.isString(res.key())) {
                        case true:
                            self._pathMaster.setCurrentRef(res);
                            return res;
                        default:
                            self._log.info(res);
                            throw new Error("invalid return value from command");
                    }
                }


                function querySuccess(res) {
                    self._log.info('query success');
                    switch (angular.isDefined(res.$ref)) {
                        //$firebaseArray or Object
                        case true:
                            self._log.info("setting ref to current object ref");
                            self._pathMaster.setCurrentRef(res.$ref());
                            self._pathMaster.setBase(res);
                            return res;
                        case false:
                            switch (angular.isObject(res[1])) {
                                case true:
                                    //record in $firebaseArray or result from geofire.get()/geofire.query()
                                    self._log.info("setting ref to current parent");
                                    self._pathMaster.setCurrentRef(res[0].$ref());
                                    self._pathMaster.setBase(res[0]);
                                    return res[1];
                                case false:
                                    //failed queries 
                                    self._log.info("return value is null");
                                    self._pathMaster.setCurrentRef(res[0].$ref());
                                    self._pathMaster.setBase(res[0]);
                                    return res[0];
                            }

                        default:
                            self._log.info(res);
                            throw new Error("invalid return value from query");

                    }
                }


                function checkTimeStampAtCreate(obj) {
                    switch (self._timeStamp) {
                        case true:
                            return self._utils.addTimeAtCreate(obj, self._createTime, self._updateTime);
                        default:
                            return obj;
                    }
                }

                function checkTimeStampAtSave(obj) {
                    switch (self._timeStamp) {
                        case true:
                            return self._utils.addTimeAtSave(obj, self._updateTime);
                        default:
                            return obj;
                    }
                }

                function qWrap(obj) {
                    return self._utils.qWrap(obj);
                }

                function qAll(x, y) {
                    return self._utils.qAll(x, y);
                }

                function qAllResult(res) {
                    return self._utils.qAllResult(res);
                }

                function standardError(err) {
                    return self._utils.standardError(err);
                }

                function inspect(item) {
                    if (!item) {
                        return self;
                    } else {
                        item = "_" + item;
                        return self[item];
                    }
                }

                self._entity = entity;
                return self._entity;
            }
        };
    }
}.call(this));

(function() {
    "use strict";
    var FirePath;

    angular.module("firebase.fuel.services")
        .factory("firePath", FirePathFactory);

    /** @ngInject*/
    function FirePathFactory($timeout, utils, $q, $log, $injector, fuelConfiguration) {
        return function(path, options) {
            var fb = new FirePath($timeout, utils, $q, $log, $injector, fuelConfiguration, path, options);
            var c = fb.construct();
            c.reset();
            return c;

        };

    }

    FirePath = function($timeout, utils, $q, $log, $injector, fuelConfiguration, path, options) {
        this._timeout = $timeout;
        this._utils = utils;
        this._q = $q;
        this._log = $log;
        this._injector = $injector;
        this._path = path;
        this._fuelConfiguration = fuelConfiguration;
        this._options = options;
        this._session = this._options.session
        this._geofire = this._options.geofire
        if (this._session === true) {
            this._sessionService = this._options.sessionService;
            this._sessionObject = this._injector.get(this._options.sessionService);
            if (!this._sessionObject) {
                throw new Error("You must provide a service to inject to access your session");
            }
            this._sessionIdMethod = this._options.sessionIdMethod;
            if (!this._sessionIdMethod) {
                throw new Error("You must provide a method to query the sessionId");
            }
        }
        if (this._geofire === true) {
            //TODO currently unused- remove
            this._geofireNode = this._options.geofireNode;
        }
    };


    FirePath.prototype = {
        construct: function() {
            var self = this;
            var fire = {};

            /*firebaseRefs*/

            /*@return{firebaseRef}
             * these will update _ref*/
            fire.reset = reset;
            fire.root = root;

            /*@return{Promise(firebaseRef)}
             * these will update _ref*/

            fire.main = main;
            fire.mainRecordRef = mainRecordRef;
            fire.nestedArrayRef = nestedArrayRef;
            fire.nestedRecordRef = nestedRecordRef;

            /*@return{Promise(angularFire)}
             * these will update _ref and _base*/
            fire.mainArray = mainArray;
            fire.mainRecord = mainRecord;
            fire.nestedArray = nestedArray;
            fire.nestedRecord = nestedRecord;
            fire.indexAf = indexAf;

            fire.buildFire = buildFire;

            fire._pathHistory = [];
            fire.base = getCurrentFirebase;
            fire.setBase = setCurrentFirebase;
            fire.ref = getCurrentRef;
            fire.path = getCurrentPath;
            fire.parent = getCurrentParentRef;
            fire.pathHistory = getPathHistory;

            fire.setCurrentRef = setCurrentRef;
            fire.inspect = inspect;

            switch (self._geofire) {
                case true:
                    return angular.extend(fire, {
                        //@return{Promise(firebaseRef)}
                        geofirePath: geofirePath,
                        geofireRef: geofireRef,
                        //@return{Promise(GeoFire)}
                        makeGeofire: makeGeofire
                    });
            }

            function buildFire(type, path, flag) {

                switch (type) {
                    case ("ref"):
                        return buildRef(path);
                    default:
                        return buildAf(type, path, flag);
                }
            }

            function buildRef(path) {
                return self._timeout(function() {
                    return self._fuelConfiguration("ref", path);
                }).then(setCurrentRef);
            }

            function buildAf(type, path, flag) {

                if (flag !== true) {
                    path = buildRef(path);
                }

                return self._utils.qAll(path, type)
                    .then(setCurrentRefAndReturn)
                    .then(setCurrentFirebase)
                    .catch(standardError);

                function setCurrentRefAndReturn(res) {
                    return self._fuelConfiguration(res[1], res[0], true)
                }
            }

            /************ Relative Paths ****************/

            function mainArrayPath() {
                return self._utils.toArray(self._path);
            }

            function mainRecordPath(id) {
                return self._utils.extendPath(mainArrayPath(), id);
            }

            function nestedArrayPath(recId, name) {
                return self._utils.extendPath(mainRecordPath(recId), name);
            }

            function nestedRecordPath(mainRecId, arrName, recId) {
                return self._utils.extendPath(nestedArrayPath(mainRecId, arrName), recId);
            }

            function geofirePath(path) {
                return mainRecordPath(path);
            }

            //unused/untested
            function makeNestedPath(parent, child) {
                return self._utils.extendPath(mainArrayPath(), self._utils.extendPath(self._utils.toArray(parent), child));
            }

            /*************** firebaseRefs ************/

            function root() {
                return reset().root();
            }

            function main() {
                return buildFire("ref", mainArrayPath());
            }

            function mainRecordRef(id) {
                return buildFire("ref", mainRecordPath(id));
            }

            function nestedArrayRef(recId, name) {
                return buildFire("ref", nestedArrayPath(recId, name));
            }

            function nestedRecordRef(recId, name, id) {
                return buildFire("ref", nestedRecordPath(recId, name, id));
            }

            function geofireRef(path) {
                return buildFire("ref", geofirePath(path));
            }

            function reset() {
                return setCurrentRef(self._fuelConfiguration("ref", self._path));
            }

            /*************** angularFire ************/

            function mainArray() {
                return buildFire("array", mainArrayPath());
            }

            function mainRecord(id) {
                return buildFire("object", mainRecordPath(id));
            }

            function nestedArray(recId, name) {
                return buildFire("array", nestedArrayPath(recId, name));
            }

            function nestedRecord(main, arr, rec) {
                return buildFire("object", nestedRecordPath(main, arr, rec));
            }

            function indexAf(recId, name, type) {
                return buildFire(type, nestedArrayPath(recId, name));
            }

            /*************** geoFire ***************/

            function makeGeofire(path) {
                return buildFire("geo", geofirePath(path));
            }


            /************ Absolute Paths ****************/

            function rootPath() {
                return root().toString();
            }

            function mainPath() {
                return reset().toString();
            }

            function sessionId() {
                return self._sessionObject[self._sessionIdMethod]();
            }

            function getCurrentPath() {
                if (getCurrentRef()) {
                    return getCurrentRef().toString();
                }
            }

            function getCurrentRef() {
                return fire._ref;
            }

            function getCurrentParentRef() {
                return fire._ref.parent();
            }

            function getCurrentFirebase() {
                return fire._base;
            }

            function setCurrentFirebase(base) {
                fire._base = base;
                return fire._base;
            }


            function setCurrentRef(res) {
                fire._ref = res;
                setCurrentPath(res.toString());
                return fire._ref;
            }

            function setCurrentPath(path) {
                if (angular.isString(fire._path)) {
                    setPathHistory(fire._path);
                }
                fire._path = path;
                return fire._path;
            }

            function setPathHistory(path) {
                fire._pathHistory.push(path);
            }

            function standardError(err) {
                return self._utils.standardError(err);
            }

            function getPathHistory() {
                return fire._pathHistory;
            }

            function inspect() {
                return self;
            }

            self._fire = fire;
            return self._fire;
        }
    };
}.call(this));

(function() {
    "use strict";

    /** @ngInject */

    function authObjFactory(fuelConfiguration) {
        return fuelConfiguration("auth");
    }

    angular.module("firebase.fuel.services")
        .factory("fuelAuth", authObjFactory);
})();

(function() {
    "use strict";


    angular.module("firebase.fuel.utils", ['platanus.inflector'])
        .factory("utils", utilsFactory);


    /** @ngInject */
    function utilsFactory($log, $q, inflector) {

        var utils = {
            addTimeAtCreate: addTimeAtCreate,
            addTimeAtSave: addTimeAtSave,
            camelize: camelize,
            extendPath: extendPath,
            flatten: flatten,
            nextPath: nextPath,
            nodeIdx: setNodeIdx,
            paramCheck: paramCheck,
            paramNodeIdx: removeMainPath,
            pluralize: pluralize,
            qWrap: qWrap,
            qAll: qAll,
            qAllResult: qAllResult,
            relativePath: relativePath,
            removeSlash: removeSlash,
            standardError: standardError,
            singularize: singularize,
            stringify: stringify,
            toArray: toArray,
        };

        return utils;

        function strCheck(str) {
            switch (angular.isString(str)) {
                case true:
                    switch (str.length < 100) {
                        case true:
                            return str;
                        case false:
                            return invalidLen(str);
                    }
                case false:
                    return invalidType(str);
            }
        }

        function arrCheck(arr) {
            switch (Array.isArray(arr)) {
                case true:
                    return arr;

                case false:
                    return invalidType(arr);
            }
        }

        function setNestedArr(arr) {
            var n = [];

        }

        function boolCheck(bool) {
            var accepted = [false, true];

            switch (accepted.indexOf(bool)) {
                case -1:
                    return invalidType(bool);
                default:
                    return bool;

            }
        }

        function invalidType(type) {
            throw new Error("Invalid parameter type at: " + type);
        }

        function invalidLen(len) {
            throw new Error("Invalid parameter length at: " + len);
        }

        function paramCheck(param, fn, d) {
            switch (angular.isUndefined(param)) {
                case true:
                    return d;
                case false:
                    switch (fn) {
                        case "bool":
                            return boolCheck(param);
                        case "str":
                            return strCheck(param);
                        case "arr":
                            return arrCheck(param);
                        case "obj":
                            return hashCheck(param);
                    }
            }
        }

        function hashCheck(hash) {
            //TODO: iterate over keys and check for and remove unknowns
            return hash;
        }

        function camelize(str, flag) {
            return inflector.camelize(str, flag);
        }

        function singularize(str) {
            return inflector.singularize(str);
        }

        function pluralize(str) {
            return inflector.pluralize(str);
        }

        function qWrap(obj) {
            return $q.when(obj);
        }

        function qAll(x, y) {
            return $q.all([x, qWrap(y)]);
        }

        function qAllResult(res) {
            if (res.length) {
                $log.info("flattening results");
                return flatten(res);
            } else {
                return res;
            }
        }


        function standardError(err) {
            return $q.reject(err);
        }

        function relativePath(path) {
            return stringify(toArray(removeSlash(path)));
        }

        function removeSlash(path) {
            if (path[path.length - 1] === "/") {
                path = path.substring(0, path.length - 1);
            }
            if (path[0] === "/") {
                path = path.substring(1);
            }
            return path;
        }

        function flatten(arr) {
            var flatResults = arr.reduce(function(x, y) {
                return x.concat(y);
            }, []);
            return flatResults;
        }

        function toArray(param) {
            if (Array.isArray(param)) {
                return flatten(param);
            } else {
                return extendPath([], param);
            }
        }

        function stringify(arr) {
            if (Array.isArray(arr)) {
                arr = arr.join('/');
            }
            return arr;
        }

        //TODO this only works if undefined is last item in array
        function extendPath(arr, id) {
            arr.push(id);
            arr = flatten(arr);
            var un = arr.indexOf(undefined);
            if (un > -1) {
                arr.splice(un, 1);
            }

            return arr;
        }

        function setNodeIdx(path, main) {
            path = removeSlash(path).slice(removeSlash(main).length);
            path = path.split('/');
            if (path[0] === "") {
                path.shift();
            }
            return path;
        }



        /* @param {array} ["currentpath","relative","to","main"]
         * @param {array} ["pathParm","relative","to","main"]
         * @return {array} [Int - idx of deepest shared node, string - remaining childpath if any]
         *
         */


        function nextPath(current, param) {

            var parent = [];
            var child = [];

            param.forEach(function(val, idx) {
                if (val === current[idx]) {
                    parent.push(val);
                } else {
                    child.push(val);
                }
            });


            if (child.length > 0) {
                child = stringify(child);
            }

            return child;

        }

        function removeMainPath(path, main) {
            path = toArray(path);
            if (path[0] === main) {
                path.shift();
            }
            return path;

        }


        function addTimeAtCreate(obj, createtime, updatetime) {
            obj[createtime] = timeStamp();
            obj[updatetime] = timeStamp();

            return obj;
        }

        function addTimeAtSave(obj, updatetime) {
            obj[updatetime] = timeStamp();

            return obj;
        }

        function timeStamp() {
            return Firebase.ServerValue.TIMESTAMP;
        }

    }



})();

(function() {
    "use strict";

    /** @ngInject */
    function loggerFactory($log) {
			//unused currently

        return {

            info: info,



        }

        function info(data) {
            $log.info(data);
        }


    }

    angular.module("firebase.fuel.logger",[])
        .factory("logger", loggerFactory);
})();
