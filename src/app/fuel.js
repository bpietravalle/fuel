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
            this._options = this._utils.paramCheck(options, "opt", {});
            this._pathOptions = {};

            /*Core Options */
            this._geofire = this._utils.paramCheck(this._options.geofire, "bool", false);
            this._gps = this._utils.paramCheck(this._options.gps, "bool", false);
            this._nestedArrays = this._utils.paramCheck(this._options.nestedArrays, "arr", []);
            this._session = this._utils.paramCheck(this._options.session, "bool", false);
            this._user = this._utils.paramCheck(this._options.user, "bool", false);
            this._timeStamp = this._utils.paramCheck(this._options.timeStamp, "bool", false);
            if (this._gps === true && this._geofire === true) {
                throw new Error("Please select either 'gps' or 'geofire'");
            }
            if (this._user === true && this._geofire === true) {
                throw new Error("Invalid option.  Please remove 'user' or 'geofire' from your options hash.");
            }

            /******************
             * Additional Config
             * *****************/

            /* GPS & Geofire */
            if (this._gps === true || this._geofire === true) {

                this._locationNode = this._utils.paramCheck(this._options.locationNode, "str", "locations");
                this._geofireNode = this._utils.paramCheck(this._options.geofireNode, "str", "geofire");
                this._latitude = this._utils.paramCheck(this._options.latitude, "str", "lat");
                this._longitude = this._utils.paramCheck(this._options.longitude, "str", "lon");
                this._typeIndex = this._utils.paramCheck(this._options.typeIndex, "bool", false);
                this._geoType = this._utils.paramCheck(this._options.geoType, "str", this._path);

                this._pathOptions.geofire = true;
                this._pathOptions.locationNode = this._locationNode;
                this._pathOptions.geofireNode = this._geofireNode;
                this._pathOptions.type = this._geoType; //to add index of current location types
                this._pathOptions.typeIndex = this._typeIndex;
                this._points = this._utils.paramCheck(this._options.points, "str", "points");
                this._pathOptions.points = this._points;
            }

            if (this._gps === true) {
                this._locationService = this._utils.paramCheck(this._options.locationService, "str", this._utils.singularize(this._locationNode));
                this._geofireService = this._utils.paramCheck(this._options.geofireService, "str", "geofire");
                this._locationObject = this._injector.get(this._locationService);
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
                    entity.createLocation = sendToGeofireToAdd;
                    entity.removeLocation = sendToGeofireForRemoval;
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
                    entity.remove = removeLocations;
                    entity.geofireRef = makeGeofire;
                    entity.get = getGeofire;
                    entity.set = setGeofire;
                    entity.query = queryGeofire;
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

                function nestedRef(id, name) {
                    return self._pathMaster.nestedRef(id, name);
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

                function makeGeofire() {
                    return self._pathMaster.makeGeofire();
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
                        .then(wrapArray)
                        .then(load)
                        .then(querySuccess)
                        .catch(standardError);

                    function wrapArray(res) {
                        return buildFire("array", res, true);
                    }
                }

                function getMainRecord(key) {
                    return qAll(loadMainArray(), key)
                        .then(getRecord)
                        .then(querySuccess)
                        .catch(standardError);

                }

                function currentUserRecords() {
                    return self._timeout(function() {
                        return queryByChild(self._uidProperty, sessionId());
                    });
                }

                function queryByChild(key, val) {
                    return mainRef().orderByChild(key).equalTo(val);

                }

                /* Commands */
                function addIndex(recId, arrName, key) {

                    if (!angular.isString(recId) && self._session === true) {
                        recId = sessionId();
                    }
                    return qAll(nestedRef(recId, arrName), key)
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

                    return qAll(nestedRef(recId, arrName), key)
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

                function sendToGeofireToAdd(locs, flag) {
                    return self._geofireObject.add(locs, flag);
                }

                /* @param{Object|Array} keys of records to remove
                 * @param{Boolean} true if only wish to remove coordinates, otherwise leave undefined
                 * @return{Array} [fireBaseRefs of removed main records]
                 */

                function sendToGeofireForRemoval(mainRecId, flag) {
                    return getIndexKeys(mainRecId, self._locationNode)
                        .then(completeRemove);

                    function completeRemove(res) {
                        return self._geofireObject.remove(res, flag);
                    }

                }

                /*****************
                 * Geofire Option
                 * ***************/

                /* @param{Object|Array} 
                 * @param{Boolean} true if only wish to save coordinates, otherwise leave undefined
                 * @return{Array} firebaseRefs of created records
                 */

                function addLocations(locs, flag) {
                    if (!angular.isArray(locs)) {
                        locs = [locs];
                    }

                    return self._q.all(locs.map(function(loc) {
                        return addLocation(loc, flag);
                    }));
                }

                /* @param{Object|Array} 
                 * @param{Boolean} true if only wish to save coordinates, otherwise leave undefined
                 * @return{Array} firebaseRefs of deleted main array record
                 */

                function removeLocations(keys, flag) {
                    if (!angular.isArray(keys)) {
                        keys = [keys];
                    }

                    return self._q.all(keys.map(function(key) {
                        return removeLocation(key, flag);
                    }));
                }


                function addLocation(data, flag) {
                    switch (flag) {
                        case true:
                            return setGeofire(data[0], data[1])
                                .then(commandSuccess)
                                .catch(standardError);
                        default:
                            return addFullLocationRecord(data)
                                .then(commandSuccess)
                                .catch(standardError);
                    }
                }

                function removeLocation(key, flag) {
                    switch (flag) {
                        case true:
                            return removeGeofire(key)
                                .then(commandSuccess)
                                .catch(standardError);
                        default:
                            return removeFullLocationRecord(key)
                                .then(commandSuccess)
                                .catch(standardError);
                    }

                }

                function addFullLocationRecord(data) {
                    var coords = {
                        lat: data[self._latitude],
                        lon: data[self._longitude]
                    };

                    return qAll(createMainRecord(data, true), coords)
                        .then(setAndPass)
                        .then(setReturnValueToFirst)
                        .catch(standardError);

                    function setAndPass(res) {
                        return qAll(setGeofire(res[0].key(), [res[1].lat, res[1].lon]), res[0]);
                    }

                }

                function removeFullLocationRecord(key) {
                    return self._q.all([removeMainRecord(key), removeGeofire(key)])
                        .then(setReturnValueToFirst)
                        // .then(mainRef)
                        .then(commandSuccess)
                        .catch(standardError);
                }


                function getGeofire(key) {
                    return qAll(makeGeofire(), key)
                        .then(getGeo)
                        .then(querySuccess)
                        .catch(standardError);
                }

                function queryGeofire(data, path) {
                    return qAll(makeGeofire(), data)
                        .then(queryGeo)
                        .then(querySuccess)
                        .catch(standardError);
                }

                function removeGeofire(key) {
                    return qAll(makeGeofire(), key)
                        .then(removeGeo)
                        .then(commandSuccess)
                        .catch(standardError);
                }

                function setGeofire(key, coords) {
                    return qAll(makeGeofire(), [key, coords])
                        .then(setGeo)
                        .then(commandSuccess)
                        .catch(standardError);
                }

                function setReturnValueToFirst(res) {
                    return self._timeout(function() {
                        return res[1];
                    });
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



                function createWithGps(data, loc) {
                    return self._q.all([createMainRecord(data), sendToGeofireToAdd(loc)])
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

                        return addIndex(res[0].key(), self._locationNode, loc.key());
                    }));
                }

                function removeWithGps(mainRecId) {

                    return qAll(sendToGeofireForRemoval(mainRecId), mainRecId)
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

                function createWithUserAndGps(data, loc) {

                    return self._q.all([createWithUser(data), sendToGeofireToAdd(loc, true)])
                        .then(addLocationIndexAndPassKey)
                        .then(setReturnValue)
                        .then(commandSuccess)
                        .catch(standardError);

                    function addLocationIndexAndPassKey(res) {
                        return qAll(addLocationIndices([res[0][1], res[1]]), res[0][1]);
                    }

                    function setReturnValue(res) {
                        return res[1];
                    }
                }

                function removeWithUserAndGps(mainRecId) {

                    return qAll(sendToGeofireForRemoval(mainRecId), mainRecId)
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
                    if (Array.isArray(res)) {
                        return res[0].$remove(res[1]);
                    } else {
                        return res.$remove();
                    }
                }

                function save(res) {
                    switch (Array.isArray(res)) {
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
                    self._log.info('command success');
                    self._log.info(res);
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
