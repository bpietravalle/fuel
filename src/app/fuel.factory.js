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

        this._timeout = $timeout;
        this._utils = utils;
        this._firePath = firePath;
        this._q = $q;
        this._log = $log;
        this._injector = $injector;
        this._path = path;
        this._options = this._utils.paramCheck(options, "opt", {});
        this._pathOptions = {};

        /*Core Options */
        this._constant = this._utils.paramCheck(this._options.constant, "str", "FBURL");
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
            this._uidProperty = this._utils.paramCheck(this._options.uidProperty, "str","uid");
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

        this._pathMaster = this._firePath(this._path, this._pathOptions, this._constant);

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

            function getMainRecord(key) {
                return qAll(loadMainArray(), key)
                    .then(getRecord)
                    .then(setReturnValue)
                    // .then(querySuccess)
                    .catch(standardError);

                function setReturnValue(res) {
                    return res;
                }
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
                    lat: data[self._latitude],
                    lon: data[self._longitude]
                };
                return qAll(self._locationObject.addLoc(self._path, data,true), [coords.lat, coords.lon])
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

            //these wont catch geofire cmmands and queries
            function commandSuccess(res) {
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
                        //record in $firebaseArray
                        switch (angular.isObject(res[1])) {
                            case true:
                                self._log.info("setting ref to current parent");
                                self._pathMaster.setCurrentRef(res[0].$ref());
                                self._pathMaster.setBase(res[1]);
                                return res[1];
                            case false:
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
}.call(this));
