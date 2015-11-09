(function() {
    "use strict";
    var FireEntity;


    angular.module("fireStarter.services")
        .factory("fireEntity", FireEntityFactory);

    /** @ngInject */
    function FireEntityFactory(utils, $timeout, firePath, $q, $log, $injector) {

        return function(path, options) {
            var fb = new FireEntity(utils, $timeout, firePath, $q, $log, $injector, path, options);
            return fb.construct();
        };

    }

    FireEntity = function(utils, $timeout, firePath, $q, $log, $injector, path, options) {
        this._utils = utils;
        this._timeout = $timeout;
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


    FireEntity.prototype = {
        construct: function() {
            var self = this;
            var entity = {};

            entity.mainArray = mainArray;
            // entity.mainRecord = mainRecord;

            /* fireBaseRef Mngt */
            entity.currentRef = getCurrentRef;
            entity.currentPath = getCurrentPath;

            /*Queries*/
            entity.loadMainArray = loadMainArray;
            entity.loadMainRecord = loadMainRecord;

            /*Commands*/
            entity.createMainRecord = createMainRecord;
            entity.removeMainRecord = removeMainRecord;
            entity.inspect = inspect;

            if (self._geofire === true) {
                //four below should be private
                entity.createLocationRecord = createLocationRecord;
                entity.removeLocationRecord = removeLocationRecord;

                entity.geofireSet = geofireSet;
                entity.geofireGet = geofireGet;
                entity.geofireRemove = geofireRemove;

                entity.trackLocations = trackLocations;
                entity.trackLocation = trackLocation;
                entity.untrackLocations = untrackLocations;
                entity.untrackLocation = untrackLocation;
            }

            if (self._user === true) {
                // entity.userNestedArray = userNestedArray;
                // entity.userNestedRecord = userNestedRecord;
                entity.loadUserRecords = loadUserRecords;
                entity.loadUserRecord = loadUserRecord;
                entity.createUserAndMain = createUserAndMain;
                entity.createUserRecord = createUserRecord;
                entity.removeUserRecord = removeUserRecord;
                entity.loadMainFromUser = loadMainFromUser;
            }

            if (self._user === true && self._geofire === true) {
                entity.createWithUserAndGeo = createWithUserAndGeo;
            }

            if (self._sessionAccess === true) {
                entity.session = session;
                entity.sessionId = sessionId;
            }

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

            function getCurrentFirebase() {
                return self._pathMaster.currentBase();
            }

            function getPathHistory() {
                return self._pathMaster.getPathHistory();
            }

            /******************************/


            /*******************
             * Access to firebase
             * *******************/


            /* @return{Promise(fireStarter)} returns a configured firebaseObj, firebaseArray, or a Geofire object
             */

            function fullQueryPath(args) {

                if (angular.isString(getCurrentPath())) {
                    if (getCurrentPath() === path) {
                        return getCurrentPath();
                    }
                }
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

            // /* User Object Interface */
            function userNestedArray() {
                return self._pathMaster.userNestedArray();
            }

            function userNestedRecord(id) {
                return self._pathMaster.userNestedRecord(id);
            }


            /*****************
             * Simple Methods
             * ***************/

            /*Queries*/
            function loadMainArray() {
                return mainArray()
                    .then(loadResult)
                    .then(querySuccess)
                    .catch(standardError);
            }

            function loadMainRecord(id) {
                return mainRecord(id)
                    .then(loadResult)
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
                    .then(addTo)
                    .then(commandSuccess)
                    .catch(standardError);
            }

            function removeMainRecord(key) {
                return mainRecord(key)
                    .then(removeResult)
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
                    .then(removeFrom)
                    .then(commandSuccess)
                    .catch(standardError);
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
                    return qAll(addTo(res), {
                        lat: res[1].lat,
                        lon: res[1].lon
                    });
                }
            }


            /* remove mainLocation record
             * @param{string} id of mainArray record
             * @return{fireBaseRef}
             */

            function removeLocationRecord(key) {

                return mainLocation(key)
                    .then(removeResult)
                    .then(commandSuccess)
                    .catch(standardError);

            }


            /* User Object Interface*/

            //TODO this needs to have option for saving as index
            //rather than firebaseArray.add()

            function loadUserRecords() {
                return userNestedArray()
                    .then(loadResult)
                    .catch(standardError);
            }

            function loadUserRecord(id) {
                return userNestedRecord(id)
                    .then(loadResult)
                    .catch(standardError);
            }

            function loadMainFromUser(rec) {
                return mainArray()
                    .then(completeAction)
                    .catch(standardError);

                function completeAction(res) {
                    return res.getRecord(rec.mainArrayKey);
                }
            }

            function session() {
                return self._sessionStorage;
            }

            function sessionId() {
                return self._sessionStorage[self._sessionIdMethod]();
            }

            /* save to user nested array 
             * @param{Object} data to save to user array - just saving key for now
             *@return{Promise(fireBaseRef)}
             */

            function createUserRecord(d) {
                return qAll(userNestedArray(), {
                        mainArrayKey: d.key()
                    })
                    .then(addTo)
                    .then(commandSuccess)
                    .catch(standardError);
            }


            function removeUserRecord(key) {

                return userNestedRecord(key)
                    .then(removeResult)
                    .then(commandSuccess)
                    .catch(standardError);
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

                // return qAll(removeFrom(res), res[1]);
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
                        .then(addTo)
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
                        .then(removeResult)
                        .then(commandSuccess)
                        .catch(standardError);
                }
                newProp[loadRec] = function(id, idxOrRec) {
                    return newProp[recName](id, idxOrRec)
                        .then(loadResult)
                        .then(querySuccess)
                        .catch(standardError);
                }

                newProp[loadRecs] = function(id) {
                    return newProp[arrName](id)
                        .then(loadResult)
                        .then(querySuccess)
                        .catch(standardError);
                }

                newProp[saveRec] = function(id, idxOrRec) {
                    return qAll(newProp[arrName](id), idxOrRec)
                        .then(saveTo)
                        .then(commandSuccess)
                        .catch(standardError);
                }

                return newProp;
            }



            /****************
             **** Helpers ****/

            /* 
             * For processing request once
             * firebaseArray|Object is accessible*/


            /* @param{Array}[firebaseArray,data object or query params]
             *@return{Promise(firebaseRef)}
             */

            function addTo(res) {
                self._log.info(res);
                return res[0].add(res[1]);
            }

            function removeFrom(res) {
                return res[0].remove(res[1]);
            }

            function saveTo(res) {
                return res[0].save(res[1]);
            }


            function getRecord(res) {
                return res[0].getRecord(res[1]);
            }

            /* @param{fireBaseObject|firebaseArray}
             * @return{Promise(firebaseRef)}
             */


            function loadResult(res) {
                return res.loaded();
            }


            /* @param{fireBaseObject}
             * @return{Promise(firebaseRef)}
             */

            function removeResult(res) {
                return res.remove();
            }

            function saveResult(res) {
                return res.save();
            }

            /*******************************/

            function commandSuccess(res) {
                self._log.info('command success');
                if (Array.isArray(res) && res[0].ref) {
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
