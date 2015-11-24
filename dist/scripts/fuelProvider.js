(function() {
    "use strict";
    var Fuel;
    angular
        .module('firebase.fuel', ['platanus.inflector', 'firebase.starter'])
    .provider("fuel", FuelProvider);

    function FuelProvider(fireStarterProvider) {
        var prov = this;
        prov.setRoot = function(val) {
            prov.rootRef = val;
            fireStarterProvider.setRoot(prov.rootRef);
        };

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
            this._rootPath = this._utils.paramCheck(prov.rootRef, "str");
						if(!this._rootPath){
							throw new Error("Please set root url in your module's configuration phase");
						}
            this._options = this._utils.paramCheck(options, "opt", {});
            this._pathOptions = {};

            /*Core Options */
            this._geofire = this._utils.paramCheck(this._options.geofire, "bool", false);
            this._gps = this._utils.paramCheck(this._options.gps, "bool", false);
            this._nestedArrays = this._utils.paramCheck(this._options.nestedArrays, "arr", []);
            this._session = this._utils.paramCheck(this._options.session, "bool", false);
            this._user = this._utils.paramCheck(this._options.user, "bool", false);

            /******************
             * Additional Config
             * *****************/

            /* Geofire */
            if (this._gps === true || this._geofire === true) {

                this._locationNode = this._utils.paramCheck(this._options.locationNode, "str", "locations");
                this._geofireNode = this._utils.paramCheck(this._options.geofireNode, "str", "geofire");
                this._latitude = this._utils.paramCheck(this._options.latitude, "str", "lat");
                this._longitude = this._utils.paramCheck(this._options.longitude, "str", "lon");

                this._pathOptions.geofire = true;
                this._pathOptions.locationNode = this._locationNode;
                this._pathOptions.geofireNode = this._geofireNode;
            }
            if (this._gps === true) {
                this._locationService = this._utils.paramCheck(this._options.locationService, "str", this._utils.singularize(this._locationNode));
                this._geofireService = this._utils.paramCheck(this._options.geofireService, "str", "geofire");
                this._locationObject = this._injector.get(this._locationService);
                this._geofireObject = this._injector.get(this._geofireService);
            }


            /* Geofire */
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

            this._pathMaster = this._firePath(this._path, this._pathOptions, this._rootPath);
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

                /*Queries*/
                entity.load = load;
                entity.getRecord = getMainRecord;
                entity.getIndexKeys = getIndexKeys;
                entity.bindTo = bindTo;

                /*Commands*/
                entity.save = saveMaster;
                entity.addIndex = addIndex;
                entity.removeIndex = removeIndex;

                if (self._user !== true && self._gps !== true) {
                    entity.add = createMainRecord;
                    entity.remove = removeMainRecord;
                }

                if (self._user === true) {
                    entity.loadUserRecords = loadUserRecords;
                    entity.userRecordsByUID = userRecordsByUID;
                }

                if (self._gps === true) {
                    entity.createLocation = createLocation;
                    entity.removeLocation = removeLocation;
                }

                if (self._user !== true && self._gps === true) {
                    entity.add = createWithGeo;
                    entity.remove = removeWithGeo;
                }

                if (self._user === true && self._gps !== true) {
                    entity.add = createWithUser;
                    entity.remove = removeWithUser;
                }

                if (self._user === true && self._gps === true) {
                    entity.add = createWithUserAndGeo;
                    entity.remove = removeWithUserAndGeo;
                }

                if (self._session === true) {
                    entity.bindCurrent = bindCurrent;
                    entity.current = current;
                    // entity.saveCurrent = saveCurrent;
                    entity.session = session;
                    entity.sessionId = sessionId;
                }

                if (self._geofire === true) {
                    entity.get = getGf;
                    entity.remove = removeGf;
                    entity.set = setGf;
                    entity.query = queryGf;
                    entity.addLoc = addLoc;
                    entity.removeLoc = removeLoc;
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

                function mainArray() {
                    return self._pathMaster.mainArray();
                }

                function mainRecord(id) {
                    return self._pathMaster.mainRecord(id);
                }

                function nestedArray(id, name) {
                    return self._pathMaster.nestedArray(id, name);
                }

                function nestedRef(id, name) {
                    return self._pathMaster.nestedRef(id, name);
                }

                function indexAf(id, name, type) {
                    return self._pathMaster.indexAf(id, name, type);
                }

                function nestedRecord(mainId, name, recId) {
                    return self._pathMaster.nestedRecord(mainId, name, recId);

                }

                /* Geofire Interface */

                function makeGeo(path) {
                    return self._pathMaster.makeGeo(path);
                }

                /*****************
                 * Main Methods
                 * ***************/

                /*Queries*/
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

                function loadUserRecords() {
                    return self._userObject
                        .getIndexKeys(sessionId(), self._path)
                        .then(loadRecs)
                        .catch(standardError);

                    function loadRecs(arr) {

                        return self._q.all(arr.map(function(key) {
                            return load(key);
                        }));


                    }
                }

                function getMainRecord(key) {
                    return qAll(loadMainArray(), key)
                        .then(getRecord)
                        .then(querySuccess)
                        .catch(standardError);

                }



                /* Commands */

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

                function createMainRecord(data, geoFlag, userFlag) {
                    if (userFlag === true) {
                        data[self._uidProperty] = sessionId();
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

                    //TODO add specs for below
                    function checkParam(param) {
                        if (angular.isString(param)) {
                            return mainRecord(key)
                                .then(remove);
                        } else {
                            return remove(key);
                        }
                    }

                }

                function saveMaster(key) {
                    return save(key)
                        .then(commandSuccess)
                        .catch(standardError);

                }

                /* GPS Option */
                function geofireSet(k, c) {
                    return self._geofireObject.set(self._path, k, c);
                }

                function geofireRemove(k) {
                    return self._geofireObject.remove(self._path, k);
                }

                function geofireGet(k) {
                    return self._geofireObject.get(self._path, k);
                }


                /* Geofire Service Option */
                function removeLoc(path, key) {
                    return nestedRecord(path, key)
                        .then(remove)
                        .then(commandSuccess)
                        .catch(standardError);
                }

                function addLoc(path, data, flag) {
                    if (flag === true) {
                        delete data[self._latitude]
                        delete data[self._longitude]
                    }

                    return qAll(nestedArray(path), data)
                        .then(add)
                        .then(commandSuccess)
                        .catch(standardError);
                }


                function setGf(path, key, coords) {
                    return qAll(makeGeo(path), [key, coords])
                        .then(setGeo)
                        .then(commandSuccess)
                        .catch(standardError);

                    function setGeo(res) {
                        return res[0].set(res[1][0], res[1][1]);
                    }

                }

                function queryGf(path, data) {
                    return qAll(makeGeo(path), data)
                        .then(queryGeo)
                        .then(querySuccess)
                        .catch(standardError);

                    function queryGeo(res) {
                        return qAll(res[0], res[0].query(res[1]));
                    }

                }

                function getGf(path, key) {
                    return qAll(makeGeo(path), key)
                        .then(getGeo)
                        .then(querySuccess)
                        .catch(standardError);

                    function getGeo(res) {
                        return qAll(res[0], res[0].get(res[1]));
                    }
                }

                function removeGf(path, key) {
                    return qAll(makeGeo(path), key)
                        .then(removeGeo)
                        .then(commandSuccess)
                        .catch(standardError);

                    function removeGeo(res) {
                        self._log.info(res);
                        return res[0].remove(res[1]);
                    }
                }


                /* @param{Object} location data to save
                 * @return{Array} [null, fireBaseRef of mainlocation]
                 */

                function createLocation(data) {
                    var coords = {
                        lat: data[self._latitude],
                        lon: data[self._longitude]
                    };
                    return qAll(self._locationObject.addLoc(self._path, data, true), [coords.lat, coords.lon])
                        .then(addGeofireAndPassLocKey)
                        .catch(standardError);


                    function addGeofireAndPassLocKey(res) {
                        return qAll(geofireSet(res[0].key(), res[1]), res[0]);
                    }
                }

                /* @param{String} key of main location to remove
                 * @return{Array} [null, fireBaseRef of mainlocation]
                 */

                function removeLocation(key) {
                    return self._locationObject
                        .removeLoc(key)
                        .then(removeGeofireAndPassLocKey)
                        .catch(standardError);

                    function removeGeofireAndPassLocKey(res) {
                        return qAll(geofireRemove(res.key()), res);
                    }
                }


                /* User Interface */

                function addUserIndex(key) {
                    return self._userObject
                        .addIndex(sessionId(), self._path, key);
                }

                function removeUserIndex(key) {
                    return self._userObject
                        .removeIndex(sessionId(), self._path, key);
                }


                /*Session Access */
                function bindCurrent(s, v) {
                    return bindTo(sessionId(), s, v);
                }

                function saveCurrent(data) {
                    return qAll(current(), data)
                        .then(save)
                        .then(commandSuccess)
                        .catch(standardError);


                }

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
                 *@return{Array} [Promise(fireBaseRef at userIndex), firebaseRef(main record created)]
                 */

                function createWithUser(data, geoFlag, userFlag) {
                    if (!userFlag) {
                        userFlag = self._uid;
                    }
                    return createMainRecord(data, geoFlag, userFlag)
                        .then(passKeyToUser)
                        .catch(standardError);

                    function passKeyToUser(res) {
                        return qAll(addUserIndex(res.key()), res);
                    }

                }

                /* remove main record and user index
                 * @param{String}  key of main record to remove
                 *@return{Array} [Promise(fireBaseRef at userIndex), firebaseRef(main record removed)]
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



                function createWithGeo(data, loc) {

                    return self._q.all([createMainRecord(data), createLocation(loc, true)])
                        .then(addLocationIndexAndPassKey)
                        .then(setReturnValue)
                        .then(commandSuccess)
                        .catch(standardError);

                    function addLocationIndexAndPassKey(res) {
                        return qAll(addIndex(res[0].key(), self._locationNode, res[1][1].key()), res[0]);
                    }

                    function setReturnValue(res) {
                        return res[1];
                    }
                }

                function removeWithGeo(mainRecId) {

                    return qAll(removeLocations(mainRecId), mainRecId)
                        .then(removeMainRec)
                        .catch(standardError);

                    function removeLocations(mainRecId) {
                        return getIndexKeys(mainRecId, self._locationNode)
                            .then(completeRemove);

                        function completeRemove(res) {
                            return self._q.all(res.map(function(key) {
                                return removeLocation(key);
                            }));
                        }

                    }

                    function removeMainRec(res) {
                        return removeMainRecord(res[1]);
                    }
                }

                /* @param{object} data to save to main array
                 * @param{object} location data to save
                 * @return{Array} [firebaseRef(location Index), firebaseRef of main record]
                 *
                 */

                function createWithUserAndGeo(data, loc) {

                    return self._q.all([createWithUser(data), createLocation(loc, true)])
                        .then(addLocationIndexAndPassKey)
                        .then(setReturnValue)
                        .then(commandSuccess)
                        .catch(standardError);

                    function addLocationIndexAndPassKey(res) {
                        return qAll(addIndex(res[0][1].key(), self._locationNode, res[1][1].key()), res[0][1]);
                    }

                    function setReturnValue(res) {
                        return res[1];
                    }
                }

                function removeWithUserAndGeo(mainRecId) {

                    return qAll(removeLocations(mainRecId), mainRecId)
                        .then(removeMainRec)
                        .catch(standardError);

                    function removeLocations(mainRecId) {
                        return getIndexKeys(mainRecId, self._locationNode)
                            .then(completeRemove);

                        function completeRemove(res) {
                            return self._q.all(res.map(function(key) {
                                return removeLocation(key);
                            }));
                        }

                    }

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

                    newProp[saveRec] = function(params) {
                        return saveMaster(params);
                    };

                    return newProp;
                }


                /****************
                 **** Helpers ****/

                function add(res) {
                    return res[0].$add(res[1]);
                }

                function remove(res) {
                    if (Array.isArray(res)) {
                        return res[0].$remove(res[1]);
                    } else {
                        return res.$remove();
                    }
                }

                function save(res) {
                    switch (Array.isArray(res)) {
                        case true:
                            return saveArray(res);
                        case false:
                            return saveObject(res);
                    }
                }

                function saveArray(res) {
                    return checkParams(res)
                        .catch(standardError);

                    function checkParams(params) {
                        switch (angular.isString(params[1])) {
                            case true:
                                return qAll(params[0].$indexFor(params[1]), params[0])
                                    .then(completeSave)
                            case false:
                                return res[0].$save(res[1]);

                        }


                    }

                    function completeSave(res) {
                        return res[1].$save(res[0]);
                    }
                }

                function saveObject(res) {
                    return res.$save();
                }

                function getRecord(res) {
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

                /* For Indices */


                function addIndex(recId, arrName, key) {

                    return qAll(nestedRef(recId, arrName), key)
                        .then(completeAction)
                        .catch(standardError);

                    function completeAction(res) {
                        return self._timeout(function() {
                                var data = {};
                                data[res[1]] = true;
                                return res[0].update(data);
                            })
                            .then(function() {
                                return res[0];
                            })
                            .catch(standardError);
                    }
                }

                function removeIndex(recId, arrName, key) {
                    return qAll(nestedRef(recId, arrName), key)
                        .then(completeAction)
                        .catch(standardError);

                    function completeAction(res) {
                        return self._timeout(function() {
                                var data = {};
                                data[res[1]] = null;
                                return res[0].update(data);
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

                function checkNestedParams(recId, arrName, flag) {
                    if (flag === true) {
                        return qWrap(entity[recId]());
                    } else {
                        return qWrap(nestedArray(recId, arrName));
                    }
                }


                /* For Queries */

                //untested/unused
                function userRecordsByUID() {
                    return self._timeout(function() {
                        return self._pathMaster.mainRef()
                            .then(sortByUID)
                            .catch(standardError);
                    });

                    function sortByUID(res) {
                        return res.orderByChild("uid").once("value", function(snap) {
                            return snap.val();
                        });
                    }
                }


                /**CQ*****************************/

                function commandSuccess(res) {
                    // self._log.info(res);
                    self._log.info('command success');
                    switch (angular.isString(res.key())) {
                        case true:
                            self._pathMaster.setCurrentRef(res);
                            return res;
                        default:
                            self._log.info(res);
                            throw new Error("invalid command success");
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
                                    self._log.info(res);
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
                            throw new Error("invalid query success");

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

    angular.module("firebase.fuel")
        .provider("firePath", FirePathProvider);

    /** @ngInject */
    function FirePathProvider(fireStarterProvider) {
        var prov = this;

        prov.$get = ["utils", "$q", "$log", "$injector", "fireStarter",
            function firePathFactory(utils, $q, $log, $injector, fireStarter) {

                return function(path, options, constant) {
                    var fb = new FirePath(utils, $q, $log, $injector, fireStarter, path, options, constant);
                    var c = fb.construct();
                    c.reset();
                    return c;

                };

            }
        ];

        FirePath = function(utils, $q, $log, $injector, fireStarter, path, options, constant) {
            this._utils = utils;
            this._q = $q;
            this._log = $log;
            this._injector = $injector;
            this._path = path;
            this._fireStarter = fireStarter;
            this._options = options;
            this._rootPath = constant;
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
                this._locationNode = this._options.locationNode;
                this._geofireNode = this._options.geofireNode;
            }
        };


        FirePath.prototype = {
            construct: function() {
                var self = this;
                var fire = {};

                fire.main = main;
                fire.reset = reset;
                fire.nestedRef = nestedRef;
                fire.root = root;
                fire.mainArray = mainArray;
                fire.mainRecord = mainRecord;
                fire.nestedArray = nestedArray;
                fire.nestedRecord = nestedRecord;
                fire.indexAf = indexAf;

                fire.build = build;

                fire._pathHistory = [];
                fire.base = getCurrentFirebase;
                fire.setBase = setCurrentFirebase;
                fire.ref = getCurrentRef;
                fire.path = getCurrentPath;
                fire.parent = getCurrentParentRef;
                fire.pathHistory = getPathHistory;
                fire.nextRef = nextRef;

                fire.setCurrentRef = setCurrentRef;
                fire.inspect = inspect;

                if (self._geofire === true) {
                    fire.makeGeo = makeGeo;
                }


                /*************** Constructor ************/

                function build(path, type) {
                    switch (isInMainNode(path)) {
                        case false:
                            throw new Error("You cannot switch to a new main node");
                        case true:
                            switch (type) {
                                case undefined:
                                    return nextRef(path);
                                default:
                                    return buildFire(type, nextRef(path), true);

                            }

                    }
                }


                function isInMainNode(path) {
                    return fullPath(path).search(mainPath()) > -1;
                }

                function completeBuild(res) {
                    return buildFire(res[1], res[0], true);
                }

                function nextRef(param) {
                    var ref;
                    switch (nodeComp(param) < 0) {
                        case true:
                            ref = setCurrentRef(getCurrentRef().child(setChild(param)));
                        case false:
                            ref = setCurrentRef(useCurrent(nodeComp(param)));
                    }
                    return ref;
                }

                function useCurrent(idx) {
                    var ref = getCurrentRef();
                    self._log.info("setting parent at index: " + idx);
                    switch (idx) {
                        case 0:
                            return ref;
                        case 1:
                            return ref.parent();
                        case 2:
                            return ref.parent().parent();
                        case 3:
                            return ref.parent().parent().parent();
                        case 4:
                            return ref.parent().parent().parent().parent();
                        case 5:
                            return ref.parent().parent().parent().parent().parent();
                        default:
                            //TODO fix so dynamically calls parent() based on idx
                            reset();
                            throw new Error("Too deep - construct again");
                    }
                }


                function buildFire(type, path, flag) {

                    return self._q.when(self._fireStarter(type, path, flag, self._rootPath))
                        .then(setCurrentRefAndReturn)
                        .catch(standardError);

                    function setCurrentRefAndReturn(res) {
                        setCurrentFirebase(res);
                        return res;
                    }
                }


                /*************** firebaseRefs ************/

                function root() {
                    return main().root();
                }

                function main() {
                    return self._fireStarter("ref", [self._path], null, self._rootPath);
                }

                function nestedRef(recId, name) {
                    return build(nestedArrayPath(recId, name));
                }

                function reset() {
                    return setCurrentRef(main());
                }

                /*************** angularFire ************/

                function mainArray() {
                    return build(self._path, "array");
                }

                function mainRecord(id) {
                    return build(mainRecordPath(id), "object");
                }

                function nestedArray(recId, name) {
                    return build(nestedArrayPath(recId, name), "array");
                }

                function nestedRecord(mainRecId, arrName, recId) {
                    return build(nestedRecordPath(mainRecId, arrName, recId), "object");
                }

                function indexAf(recId, name, type) {
                    return build(nestedArrayPath(recId, name), type);
                }

                /*************** geoFire ***************/

                function makeGeo(path) {
                    return build(self._utils.toArray([self._path, path]), "geo");
                }

                /************ Absolute Paths ****************/

                function rootPath() {
                    return self._utils.removeSlash(self._rootPath);
                }

                function mainPath() {
                    return fullPath(self._path);
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

                function makeNestedPath(parent, child) {
                    return self._utils.extendPath(mainArrayPath(), self._utils.extendPath(self._utils.toArray(parent), child));
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


                function setCurrentRef(res, flag) {
                    fire._ref = res;
                    setCurrentPath(res.toString());
                    if (flag === true) {
                        setCurrentFirebase(null);
                    }

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

                function nodeIdx() {
                    return self._utils.nodeIdx(getCurrentPath(), mainPath());
                }

                function setChild(param) {
                    return self._utils.nextPath(nodeIdx(), paramNodeIdx(param));
                }

                function paramNodeIdx(param) {
                    return self._utils.paramNodeIdx(param, self._path);
                }

                function nodeComp(param) {
                    return nodeIdx().length - paramNodeIdx(param).length;
                }

                function fullPath(path) {
                    return self._utils.stringify([rootPath(), self._utils.relativePath(path)]);
                }

                function inspect() {
                    return self;
                }

                self._fire = fire;
                return self._fire;
            }
        };
    }
}.call(this));

(function() {
    "use strict";


    angular.module("firebase.fuel")
        .factory("utils", utilsFactory);


    /** @ngInject */
    function utilsFactory($log, $q, inflector) {

        var utils = {

            toArray: toArray,
            camelize: camelize,
            extendPath: extendPath,
            flatten: flatten,
            removeSlash: removeSlash,
            stringify: stringify,
            pluralize: pluralize,
            relativePath: relativePath,
            qWrap: qWrap,
            qAll: qAll,
            qAllResult: qAllResult,
            singularize: singularize,
						paramCheck: paramCheck,
						paramNodeIdx: removeMainPath,
            nodeIdx: setNodeIdx,
            nextPath: nextPath,
            standardError: standardError,

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
					var accepted = [false,true];

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
                        case "opt":
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
            if (path[path.length-1] === "/") {
                path = path.substring(0, path.length-1);
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
						if(path[0]===""){
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
    }



})();
