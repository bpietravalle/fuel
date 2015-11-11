(function() {
    "use strict";
    var Fuel;


    angular.module("firebase-fuel")
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
        this._options = options;
        this._nestedArrays = [];
        this._pathOptions = {};
        if (this._options) {
            this._geofire = false || this._options.geofire;
            if (this._options.nestedArrays) {
                if (!Array.isArray(this._options.nestedArrays)) {
                    throw new Error("Nested Arrays argument must be an array");
                } else {
                    this._nestedArrays = this._options.nestedArrays;
                }
            }
            if (this._geofire === true) {
                this._locationName = "locations";
                this._geofireName = "geofire";
                this._nestedArrays.push(this._locationName);
                this._locationPath = [this._locationName, this._path];
                this._geofirePath = [this._geofireName, this._path];
                this._pathOptions.geofire = true;
                this._pathOptions.locationName = this._locationName;
                this._pathOptions.geofireName = this._geofireName;
            }
            this._user = this._options.user || false;
            this._sessionAccess = this._options.sessionAccess || false;
            if (this._user === true) {
                this._userPath = "users";
                this._sessionAccess = true;
            }
            if (this._sessionAccess === true) {
                this._pathOptions.sessionAccess = true;
                this._pathOptions.userName = this._userPath;
                if (!this._options.sessionLocation) {
                    this._sessionName = "session";
                    this._pathOptions.sessionLocation = this._sessionName;
                    this._sessionStorage = this._injector.get(this._sessionName);
                } else {
                    this._sessionStorage = this._injector.get(this._options.sessionLocation);
                }
                if (this._options.sessionIdMethod) {
                    this._sessionIdMethod = this._options.sessionIdMethod;
                } else {
                    this._sessionIdMethod = "getId";
                }
                this._pathOptions.sessionIdMethod = this._sessionIdMethod;
            }
        }
        this._pathMaster = this._firePath(this._path, this._pathOptions);
    };


    Fuel.prototype = {
        construct: function() {
            var self = this;
            var entity = {};

            // entity.mainArray = mainArray;
            // entity.mainRecord = mainRecord;

            /* fireBaseRef Mngt */
            entity.currentBase = getCurrentBase;
            entity.currentRef = getCurrentRef;
            entity.currentPath = getCurrentPath;
            entity.currentParentRef = getCurrentParentRef;

            /*Queries*/
            entity.load = load;
            entity.userRecordsByUID = userRecordsByUID;
            entity.userRecordsByIndex = userRecordsByIndex;
            // entity.getRecord = getRecord;

            /*Commands*/
            entity.add = createMainRecord;
            entity.save = save;
            entity.remove = removeMainRecord;
            entity.inspect = inspect;

            if (self._geofire === true) {
                entity.addLocationIndex = addLocationIndex;
                entity.removeLocationIndex = removeLocationIndex;

                entity.createLocationRecord = createLocationRecord;
                entity.removeLocationRecord = removeLocationRecord;

                entity.geofireSet = geofireSet;
                entity.geofireGet = geofireGet;
                entity.geofireRemove = geofireRemove;

                //     entity.trackLocations = trackLocations;
                //     entity.trackLocation = trackLocation;
                //     entity.untrackLocations = untrackLocations;
                //     entity.untrackLocation = untrackLocation;
            }

            if (self._user === true) {


                entity.addUserIndex = addUserIndex;
                entity.removeUserIndex = removeUserIndex;
                entity.createWithUser = createWithUser;
                entity.removeWithUser = removeWithUser;
            }

            // if (self._user === true && self._geofire === true) {
            //     entity.createWithUserAndGeo = createWithUserAndGeo;
            // }

            if (self._sessionAccess === true) {
                entity.session = session;
                entity.sessionId = sessionId;
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
                return self._pathMaster.currentPath();
            }

            function getCurrentRef() {
                return self._pathMaster.currentRef();
            }

            function getCurrentParentRef() {
                return self._pathMaster.currentParentRef();
            }

            function getCurrentBase() {
                return self._pathMaster.currentBase();
            }

            function getPathHistory() {
                return self._pathMaster.getPathHistory();
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

            function nestedRecord(mainId, name, recId) {
                return self._pathMaster.nestedRecord(mainId, name, recId);
            }

            /* Geofire Interface */
            function mainLocations() {
                return self._pathMaster.mainLocationsArray();
            }

            function mainLocation(id) {
                return self._pathMaster.mainLocationsRecord(id);
            }

            function geofireArray() {
                return self._pathMaster.geofireArray();
            }

            function locationsIndex(id) {
                return self._pathMaster.locationsIndex(id);
            }

            // /* User Object Interface */
            function userIndex() {
                return self._pathMaster.userIndex();
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

            /*Commands*/

            function createMainRecord(data, geoFlag, userFlag) {
                if (geoFlag === true && data.geo) {
                    delete data["geo"]
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
                return mainRecord(key)
                    .then(remove)
                    .then(commandSuccess)
                    .catch(standardError);
            }


            /* Geofire Interface */

            /**
             * Two Parts:
             * 1.) provides access to store and retrieve coordinates in GeoFire
             * 2.) Any addition location data(ie google place_id, reviews, etc. can be stored in a separate
             * firebase node (currently called "locations" and refered to as the mainLocations array) **/


            function geofireSet(k, c) {
                return qAll(geofireArray(), [k, c])
                    .then(completeAction)
                    .catch(standardError);

                function completeAction(res) {
                    return res[0].set(res[1][0], res[1][1]);
                }
            }

            function geofireGet(k) {
                return qAll(geofireArray(), k)
                    .then(getIn)
                    .then(querySuccess)
                    .catch(standardError);

                function getIn(res) {
                    return res[0].get(res[1]);
                }
            }

            function geofireRemove(k) {
                return qAll(geofireArray(), k)
                    .then(removeGeo)
                    .then(commandSuccess)
                    .catch(standardError);

                function removeGeo(res) {
                    return res[0].remove(res[1]);
                }
            }


            /* save to mainLocation array
             * @param{Object}
             * @return{fireBaseRef}
             */

            //just for single records for now
            function createLocationRecord(data, geoFlag) {
                return qAll(mainLocations(), data)
                    .then(addDataAndPass)
                    .then(qAllResult)
                    .then(commandSuccess)
                    .catch(standardError);


                function addDataAndPass(res) {
                    //coords don't pass if send more than one record
                    return qAll(add(res), {
                        lat: res[1].lat,
                        lon: res[1].lon
                    });
                }


            }

            function saveNestedLocationAndGeofireSet(res) {

							//need id for mainArrayKey

                return self._q.all([
                    addLocationIndex(id, res[0].key()),
                    geofireSet(res[0], res[1])
                ]);

            }


            /* remove mainLocation record
             * @param{string} id of mainArray record
             * @return{fireBaseRef}
             */

            function removeLocationRecord(key) {

                return mainLocation(key)
                    .then(remove)
                    .then(commandSuccess)
                    .catch(standardError);

            }

            function addLocationIndex(recId, key) {
                return qAll(locationsIndex(recId), key)
                    .then(addIndex)
                    .then(commandSuccess)
                    .catch(standardError);
            }

            function removeLocationIndex(recId, key) {
                return qAll(locationsIndex(recId), key)
                    .then(removeIndex)
                    .then(commandSuccess)
                    .catch(standardError);
            }


            /* User Object Interface*/

            //TODO this needs to have option for saving as index
            //rather than firebaseArray.add()

            function addUserIndex(key) {
                return qAll(userIndex(), key)
                    .then(addIndex)
                    .then(commandSuccess)
                    .catch(standardError);
            }

            function removeUserIndex(key) {
                return qAll(userIndex(), key)
                    .then(removeIndex)
                    .then(commandSuccess)
                    .catch(standardError);
            }

            function session() {
                return self._sessionStorage;
            }

            function sessionId() {
                return self._sessionStorage[self._sessionIdMethod]();
            }

            /* save to user nested array 
             * @param{Object} data to save to user array - just saving key for now
             *@return{Promise(fireBaseRef at userNestedArray)}
             */

            function createWithUser(data) {

                return createMainRecord(data)
                    .then(passKeyToUser)
                    .catch(standardError);

                function passKeyToUser(res) {
                    return qAll(addUserIndex(res.key()), res.key());
                }
            }

            function removeWithUser(key) {

                return removeMainRecord(key)
                    .then(passKeyToUser)
                    .catch(standardError);

                function passKeyToUser(res) {
                    return removeUserIndex(res.key());
                }
            }


            /*********************************/

            /*
             * Complex Methods */


            //still needs more tests
            function createWithUserAndGeo(data, loc) {

                /* 1.) adds main array record
                 * 2.) adds user nested record,
                 * 3.) adds records to main location array for each location
                 * 4.) adds coordinates to geofire(key used is mainLocation key)
                 * 5.) updates main array record by adding nested locations array with mainLocation keys
                 */

                return qAll(createMainRecord(data, true, true), loc)
                    .then(trackLocationAndAddUserRec)
                    .then(addNestedLocations)
                    .catch(standardError);

                function trackLocationAndAddUserRec(res) {
                    return self._q.all([trackLocations(res[1], res[0].key()),
                        createUserRecord(res[0]), qWrap(res[0])
                    ]);
                }

                function addNestedLocations(res) {
                    return self._q.all(res[0].map(function(loc) {
                        return createNestedLocationRecord(res[2].key(), loc[1].key());
                    }));

                }

            }

            function createUserAndMain(data, geoFlag) {
                return createMainRecord(data, geoFlag, true)
                    .then(createUserRecord)
                    .catch(standardError);
            }

            function trackLocations(data, key) {
                return self._q.all(data.map(function(item) {
                        return trackLocation(item, key);
                    }))
                    .catch(standardError);
            }

            function trackLocation(data, key) {
                return createLocationRecord(addLocationKey(data, key))
                    .then(sendToGeoFireAndPassLocationResults)
                    .then(returnLocationResults)
                    .then(commandSuccess)
                    .catch(standardError);

                function sendToGeoFireAndPassLocationResults(res) {
                    return qAll(geofireSet(res[0].key(), [res[1].lat, res[1].lon]), res[0]);
                }

                function returnLocationResults(res) {
                    self._log.info('res+++');
                    self._log.info(res);
                    return res[1];
                }

                function addLocationKey(obj, key) {
                    obj.mainArrayKey = key;
                    return obj;
                }
            }

            /*@param{Array} pass keys 
             *@return{Array} [[null,fireBaseRef(main Location)]]
             */

            function untrackLocations(keys) {

                return self._q.all(keys.map(function(key) {
                        return untrackLocation(key)
                            .catch(standardError);
                    }))
                    .catch(standardError);

            }

            function untrackLocation(key) {


                return qAll(getIndex(mainLocations(), key), key)
                    .then(removeMainAndPassKey)
                    .then(removeCoords)
                    .then(commandSuccess)
                    .catch(standardError);

                // function removeMainAndPassKey(res) {

                // return qAll(remove(res), res[1]);
                // }

                // function removeCoords(res) {
                // return geofireRemove(res[1]);
                // }
            }


            /*********************************/

            /* Nested Arrays constructor
             */

            function addNested(obj, arr) {
                var newProperties = {};

                self._q.all(arr.map(function(item) {
                    angular.extend(newProperties, addNestedArray(obj, item));
                }))

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
                    return nestedArray(id, arrName);
                }

                newProp[recName] = function(mainRecId, nestedRecId) {
                    return nestedRecord(mainRecId, arrName, nestedRecId);
                }

                newProp[addRec] = function(id, data) {
                    return qAll(newProp[arrName](id), data)
                        .then(add)
                        .then(commandSuccess)
                        .catch(standardError);
                }

                newProp[getRec] = function(mainRecId, key) {

                    return qAll(newProp[arrName](mainRecId), key)
                        .then(getRecord)
                        .then(querySuccess)
                        .catch(standardError);
                }

                newProp[removeRec] = function(mainRecId, key) {
                    return newProp[recName](mainRecId, key)
                        .then(remove)
                        .then(commandSuccess)
                        .catch(standardError);
                }
                newProp[loadRec] = function(id, idxOrRec) {
                    return newProp[recName](id, idxOrRec)
                        .then(loaded)
                        .then(querySuccess)
                        .catch(standardError);
                }

                newProp[loadRecs] = function(id) {
                    return newProp[arrName](id)
                        .then(loaded)
                        .then(querySuccess)
                        .catch(standardError);
                }

                newProp[saveRec] = function(id, idxOrRec) {
                    return qAll(newProp[arrName](id), idxOrRec)
                        .then(save)
                        .then(commandSuccess)
                        .catch(standardError);
                }

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


            function loaded(res) {
                return res.$loaded();
            }

            /* For Indices */

            function addIndex(res) {
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

            function removeIndex(res) {
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

            /* For Queries */

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

            function userRecordsByIndex() {
                // var keys = Object.keys(userIndex());
                return self._timeout(function() {
                    self._q.all([self._pathMaster.mainRef(), userIndex()])
                        .then(sortByIdx)
                        .then(sendToArray)
                        .catch(standardError);

                    function sortByIdx(res) {
                        // var keys = res[1].children
                        // self._log.info(keys);
                        return res[1];

                        // return self._q.all(Object.keys(res[1]).map(function(key) {
                        //     return res[0].once("value", function(snap) {
                        //         if (snap.hasChild(key)) {
                        //             return snap;
                        //         }
                        //     });
                        // }));
                    }

                    function sendToArray(res) {
                        self._log.info(res);
                        return res;

                    }
                });

            }



            /*******************************/

            //these wont catch geofire cmmands and queries
            function commandSuccess(res) {
                self._log.info('command success');
                if (Array.isArray(res)) {
                    self._pathMaster.setCurrentRef(res[0]);
                } else {
                    self._pathMaster.setCurrentRef(res);
                }
                return res;
            }

            function querySuccess(res) {
                self._log.info('query success');
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
