(function() {
    "use strict";
    var Fuel;


    angular.module("firebase.fuel")
        .factory("fuel", FuelFactory);

    /** @ngInject */
    function FuelFactory($timeout, utils, firePath, $q, $log, $injector) {

        return function(path, options) {
            var fb = new Fuel($timeout, utils, firePath, $q, $log, $injector, path, options);
            return fb.construct();
        };

    }

    Fuel = function($timeout, utils, firePath, $q, $log, $injector, path, options) {
        //TODO: error messages for invalid entires for user , geofire, or gps
        //only except true...
        this._timeout = $timeout;
        this._utils = utils;
        this._firePath = firePath;
        this._q = $q;
        this._log = $log;
        this._injector = $injector;
        this._path = path;
        this._options = options;
        this._nestedArrays = [];
        this._pathOptions = {};
        if (this._options) {
            this._gps = false || this._options.gps;
            this._geofire = false || this._options.geofire;
            if (this._options.nestedArrays) {
                if (!Array.isArray(this._options.nestedArrays)) {
                    throw new Error("Nested Arrays argument must be an array");
                } else {
                    this._nestedArrays = this._options.nestedArrays;
                }
            }
            if (this._gps === true) {
                //below messes up methods to main location array- need another way
                // this._nestedArrays.push(this._locationName);
                this._locationObject = this._injector.get("location");
                this._geofireObject = this._injector.get("geofire");
            }

            if (this._gps === true || this._geofire === true) {
                this._pathOptions.geofire = true;
                this._locationName = "locations";
                this._geofireName = "geofire";
                this._pathOptions.locationName = this._locationName;
                this._pathOptions.geofireName = this._geofireName;
            }
            this._user = this._options.user || false;
            this._sessionAccess = this._options.sessionAccess || false;
            if (this._user === true) {
                this._userPath = "users";
                this._userObject = this._injector.get("user");
                this._sessionAccess = true;
            }
            if (this._sessionAccess === true) {
                this._pathOptions.sessionAccess = true;
                if (!this._options.sessionLocation) {
                    this._sessionName = "session";
                } else {
                    this._sessionName = this._options.sessionLocation;
                }
                this._sessionStorage = this._injector.get(this._sessionName);
                if (this._options.sessionIdMethod) {
                    this._sessionIdMethod = this._options.sessionIdMethod;
                } else {
                    this._sessionIdMethod = "getId";
                }
                this._pathOptions.sessionLocation = this._sessionName;
                this._pathOptions.sessionIdMethod = this._sessionIdMethod;
            }
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

            entity.addIndex = addIndex;
            entity.removeIndex = removeIndex;
            entity.getIndexKeys = getIndexKeys;

            /*Queries*/
            entity.load = load;
            entity.userRecordsByUID = userRecordsByUID;
            entity.getRecord = getRecord;
            entity.save = saveMainRecord;
            entity.bindTo = bindTo;

            /*Commands*/

            if (self._user !== true && self._gps !== true) {
                entity.add = createMainRecord;
                entity.remove = removeMainRecord;
            }

            if (self._user === true) {
                entity.loadUserRecords = loadUserRecords;
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

            if (self._sessionAccess === true) {
                entity.session = session;
                entity.sessionId = sessionId;
                entity.bindCurrent = bindCurrent;
            }

            if (self._geofire === true) {
                entity.get = getGf;
                entity.remove = removeGf;
                entity.set = setGf;
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

            /*Commands*/

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
                if (geoFlag === true && data.geo) {
                    delete data.geo
                }
                if (userFlag === true) {
                    data.uid = sessionId();
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

            function saveMainRecord(key) {
                return checkParam(key)
                    .then(commandSuccess)
                    .catch(standardError);

                //TODO add specs for below
                function checkParam(param) {
                    if (angular.isString(param)) {
                        return mainRecord(key)
                            .then(save);
                    } else {
                        return save(key);
                    }
                }

            }

            /* Geofire Interface */

            function geofireSet(k, c) {
                return self._geofireObject.set(self._path, k, c);
            }

            function geofireRemove(k) {
                return self._geofireObject.remove(self._path, k);
            }

            function geofireGet(k) {
                return self._geofireObject.get(self._path, k);
            }


            /* Geofire API access */

            function removeLoc(path, key) {
                return nestedRecord(path, key)
                    .then(remove)
                    .then(commandSuccess)
                    .catch(standardError);
            }

            function addLoc(path, data) {
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

            function getGf(path, key) {
                return qAll(makeGeo(path), key)
                    .then(getGeo)
                    .then(querySuccess)
                    .catch(standardError);

                function getGeo(res) {
                    return res[0].get(res[1]);
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
                    lat: data.lat,
                    lon: data.lon
                };
                return qAll(self._locationObject.addLoc(self._path, data), [coords.lat, coords.lon])
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


            /* User Object Interface*/

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

            function session() {
                return self._sessionStorage;
            }

            function sessionId() {
                return self._sessionStorage[self._sessionIdMethod]();
            }

            /*********************************/

            /*
             * Combo Methods */

            /* save main record and to user index
             * @param{Object} data to save to user array - just saving key for now
             *@return{Array} [Promise(fireBaseRef at userIndex), firebaseRef(main record created)]
             */

            function createWithUser(data, geoFlag, userFlag) {
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
                    return qAll(addIndex(res[0].key(), self._locationName, res[1][1].key()), res[0]);
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
                    return getIndexKeys(mainRecId, self._locationName)
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

                return self._q.all([createWithUser(data, null, true), createLocation(loc, true)])
                    .then(addLocationIndexAndPassKey)
                    .then(setReturnValue)
                    .then(commandSuccess)
                    .catch(standardError);

                function addLocationIndexAndPassKey(res) {
                    return qAll(addIndex(res[0][1].key(), self._locationName, res[1][1].key()), res[0][1]);
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
                    return getIndexKeys(mainRecId, self._locationName)
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

            //untested/unused
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
                    return nestedArray(id, arrName);
                };

                newProp[recName] = function(mainRecId, nestedRecId) {
                    return nestedRecord(mainRecId, arrName, nestedRecId);
                };

                newProp[addRec] = function(id, data) {
                    return qAll(newProp[arrName](id), data)
                        .then(add)
                        .then(commandSuccess)
                        .catch(standardError);
                };

                newProp[getRec] = function(mainRecId, key) {

                    return qAll(newProp[arrName](mainRecId), key)
                        .then(getRecord)
                        .then(querySuccess)
                        .catch(standardError);
                };

                newProp[removeRec] = function(mainRecId, key) {
                    return newProp[recName](mainRecId, key)
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

                newProp[saveRec] = function(id, idxOrRec) {
                    return qAll(newProp[arrName](id), idxOrRec)
                        .then(save)
                        .then(commandSuccess)
                        .catch(standardError);
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
                if (Array.isArray(res)) {
                    return res[0].$save(res[1]);
                } else {
                    return res.$save();
                }
            }

            function getRecord(res) {
                return res[0].$getRecord(res[1]);
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


            /*******************************/

            //these wont catch geofire cmmands and queries
            function commandSuccess(res) {
                self._log.info('command success');
                // if (Array.isArray(res)) {
                // self._pathMaster.setCurrentRef(res[0]);
                // } else {
                self._pathMaster.setCurrentRef(res);
                // }
                return res;
            }

            function querySuccess(res) {
                self._log.info('query success');
                self._log.info(res.$ref().key());
                self._pathMaster.setCurrentRef(res.$ref());
                return res;
            }


            /**misc*/


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

            /*to remove later on*/
            function inspect() {
                return self;
            }

            self._entity = entity;
            return self._entity;
        }
    };
}.call(this));
