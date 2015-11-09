(function() {
    "use strict";
    var FirePath;

    angular.module("fireStarter.services")
        .factory("firePath", firePathFactory);

    /** @ngInject */
    function firePathFactory(utils, $window, $q, $log, $injector, FBURL, fireStarter) {

        return function(path, options) {
            var fb = new FirePath(utils, $window, $q, $log, $injector, fireStarter, path, options, FBURL);
            return fb.construct();

        };

    }

    FirePath = function(utils, $window, $q, $log, $injector, fireStarter, path, options, FBURL) {
        this._utils = utils;
        this._window = $window;
        this._FBURL = FBURL;
        this._q = $q;
        this._log = $log;
        this._injector = $injector;
        this._path = path;
        this._fireStarter = fireStarter;
        this._options = options || null;
        if (!this._FBURL) {
            if (this._options.root) {
                this._rootPath = this._injector.get(this._options.root);
            } else {
                throw new Error("You must provide a root path, either by a constant 'FBURL' or by providing a service name to inject");
            }
        } else {
            this._rootPath = this._FBURL;
        }
        this._sessionAccess = false;
        this._geofire = false;
        if (this._options) {
            if (this._options.sessionAccess === true) {
                this._sessionAccess = true;
                if (this._options.sessionLocation) {
                    this._sessionStorage = this._injector.get(this._options.sessionLocation);
                } else {
                    throw new Error("You must provide a service to inject to access your session");
                }
                if (this._options.sessionIdMethod) {
                    this._sessionIdMethod = this._options.sessionIdMethod;
                } else {
                    throw new Error("You must provide a method to query the sessionId");
                }
                if (this._options.userName) {
                    this._userName = this._options.userName;
                } else {
                    this._userName = "users";
                }
            }
            if (this._options.geofire === true) {
                this._geofire = true;
                this._locationName = this._options.locationName;
                this._geofireName = this._options.geofireName;
            }
        }
    };


    FirePath.prototype = {
        construct: function() {
            var self = this;
            var fire = {};

            fire.rootRef = root;
            fire.mainArray = mainArray;
            fire.mainRecord = mainRecord;
            fire.nestedArray = nestedArray;
            fire.nestedRecord = nestedRecord;
            fire.makeNestedRef = makeNestedRef;
            //TODO make below private
            fire.checkPathParams = checkPathParams;

            fire.currentNode = currentNode;
            fire.currentParentNode = currentParentNode;
            fire.currentRecord = currentRecord;
            fire.currentNestedArray = currentNestedArray;
            fire.currentNestedRecord = currentNestedRecord;
            fire.currentNodeIdx = currentNodeIdx;

            fire._pathHistory = [];
            fire.currentBase = getCurrentFirebase;
            fire.currentRef = getCurrentRef;
            fire.currentPath = getCurrentPath;
            fire.currentParentRef = getCurrentParentRef;
            fire.currentParentPath = getCurrentParentPath;
            fire.pathHistory = getPathHistory;
            fire.currentDepth = currentDepth;

            fire.setCurrentRef = setCurrentRef;
            fire.inspect = inspect;

            if (self._sessionAccess === true) {
                // fire.userNestedArray = userNestedArray;
                // fire.userNestedRecord = userNestedRecord;
            }
            if (self._geofire = true) {
                fire.geofireArray = geofireArray;
                fire.geofireRecord = geofireRecord;
                // fire.mainLocationsArray = mainLocationsArray;
                // fire.mainLocationsRecord = mainLocationsRecord;
            }

            /*************** firebaseRefs ************/

						setCurrentRef(root());

            function checkPathParams(path, type) {
                var ref, str = fullPath(path);
                switch (getCurrentRef()) {
                    case undefined:
                        self._log.info("setting new firebase node");
                        ref = setChild(relativePath(path));
                        break;
                    default:
                        switch (str) {
                            case getCurrentPath():
                                self._log.info("Reusing currentRef");
                                ref = getCurrentRef();
                                break;
                            case getCurrentParentPath():
                                self._log.info("Using currentParentRef");
                                ref = getCurrentParentRef();
                                break;
                            default:
                                if (isCurrentChild(str)) {
                                    self._log.info("Building childRef");
                                    ref = buildChildRef(str);
                                } else {
                                    self._log.info("Setting new firebase node");
                                    ref = setChild(relativePath(path));
                                }
                        }
                }

                return setCurrentRef(ref)
                    .then(setFire)
                    .catch(standardError);

                function setFire(res) {
                    if (type) {
                        return buildFire(type, res, true);
                    } else {
                        return res;
                    }
                }
            }

            function buildFire(type, path, flag) {

                return self._q.when(self._fireStarter(type, path, flag))
                    .then(setCurrentRefAndReturn)
                    .catch(standardError)

                function setCurrentRefAndReturn(res) {
                    setCurrentFirebase(res);
                    return res;
                }
            }

            function root() {
                return new self._window.Firebase(rootPath());
            }

            function setChild(path) {
                return root().child(stringify(path));
            }

            function mainArray() {
                return checkPathParams(mainArrayPath(), "array");
            }

            function mainRecord(id) {
                return checkPathParams(mainRecordPath(id), "object");
            }

            function nestedArray(recId, name) {
                return checkPathParams(nestedArrayPath(recId, name), "array");
            }

            function nestedRecord(mainRecId, arrName, recId) {
                return checkPathParams(nestedRecordPath(mainRecId, arrName, recId), "object");
            }

            //need test for type
            function makeNestedRef(parent, child, type) {
                return checkPathParams(makeNestedPath(parent, child), type);
            }

            /* User Object refs */
            function userNestedArray() {
                return checkPathParams(userNestedArrayPath(), "array");
            }

            function userNestedRecord(id) {
                return checkPathParams(userNestedRecordPath(id), "object");
            }

            /* Geofire refs */
            function geofireArray() {
                return checkPathParams(geofireArrayPath(), "geo");
            }

            function geofireRecord(id) {
                return checkPathParams(geofireRecordPath(id), "geo");
            }

            /* Main Location Array refs */
            function mainLocationsArray() {
                return checkPathParams(mainLocationArrayPath(), "array");
            }

            function mainLocationsRecord(id) {
                return checkPathParams(mainLocationRecordPath(id), "object");
            }

            /************ Paths *************************/

            function rootPath() {
                return removeSlash(self._rootPath);
            }

            function mainArrayPath() {
                return arrayify(self._path);
            }

            function mainRecordPath(id) {
                return extendPath(mainArrayPath(), id);
            }

            function nestedArrayPath(recId, name) {
                return extendPath(mainRecordPath(recId), name);
            }

            function nestedRecordPath(mainRecId, arrName, recId) {
                return extendPath(nestedArrayPath(mainRecId, arrName), recId);
            }

            function makeNestedPath(parent, child) {
                return extendPath(mainArrayPath(), extendPath(arrayify(parent), child));
            }

            function userNestedArrayPath() {
                return arrayify([self._userName, sessionId(), self._path]);
            }

            function userNestedRecordPath(id) {
                return extendPath([self._userName, sessionId(), self._path], id);
            }

            function geofireArrayPath() {
                return arrayify([self._geofireName, self._path]);
            }

            function geofireRecordPath(id) {
                return extendPath([self._geofireName, self._path], id);
            }

            function mainLocationArrayPath() {
                return arrayify([self._locationName, self._path]);
            }

            function mainLocationRecordPath(id) {
                return extendPath([self._locationName, self._path], id);
            }

            function sessionId() {
                return self._sessionStorage[self._sessionIdMethod]();
            }

            function currentNode() {
                currentPathCheck();
                var path = getCurrentPath();
                return relativePathArray(path)[relativePathArray(path).length - 1];
            }

            function currentRecord() {
                currentPathCheck();
                var path = getCurrentPath();
                return relativePathArray(path)[1];
            }

            function currentParentNode() {
                currentPathCheck();
                var path = getCurrentPath();
                return relativePathArray(path)[relativePathArray(path).length - 2];
            }

            function currentDepth() {
                currentPathCheck();
                var path = getCurrentPath();
                return relativePathArray(path).length;
            }

            function currentNestedArray() {
                currentPathCheck();
                var path = getCurrentPath();
                return relativePathArray(path)[2];
            }

            function currentNestedRecord() {
                currentPathCheck();
                var path = getCurrentPath();
                return relativePathArray(path)[3];
            }

            function currentNodeIdx(str) {
                currentPathCheck();
                var path = getCurrentPath();
                return nodeIdx(path, str);
            }

            function pathLength(path) {
                return fullPath(path).length;
            }

            function currentPathCheck() {
                if (!getCurrentPath()) {
                    throw new Error("You must define a current firebaseRef and path first");
                }
            }

            function relativePathArray(str) {
                if (str.search(rootPath()) < 0) {
                    throw new Error("you must pass an absolute path");
                } else {
                    return str.slice(rootPath().length).split('/');
                }
            }



            function nodeIdx(path, str) {
                return relativePathArray(path).indexOf(str);
            }

            function isCurrentChild(path) {
                var pathSub;
                pathSub = path.substring(0, getCurrentPath().length);
                if (path.length > getCurrentPath().length) {
                    return pathSub === getCurrentPath();
                } else {
                    return false;
                }
            }

            function buildChildRef(path) {
                return getCurrentRef().child(path.slice(getCurrentPath().length));
            }

            function getCurrentPath() {
                if (getCurrentRef()) {
                    return getCurrentRef().toString();
                }
            }

            function getCurrentRef() {
                return fire._currentRef;
            }

            function getCurrentParentRef() {
                return fire._currentRef.parent();
            }

            function getCurrentParentPath() {
                if (getCurrentParentRef()) {
                    return getCurrentParentRef().toString();
                }
            }

            function getCurrentFirebase() {
                return fire._currentBase;
            }

            function setCurrentFirebase(base) {
                fire._currentBase = base;
                return fire._currentBase;
            }

            function setCurrentRef(ref) {
                var path;
                return checkArray(ref)
                    .then(checkRefAndSet)
                    .catch(standardError);

                function checkArray(ref) {
                    if (Array.isArray(ref)) {
                        return self._q.when(ref[0])
                            .catch(function() {
                                self._q.reject(("firebaseRef must be first item in the array"));
                            });
                    } else {
                        return self._q.when(ref);
                    }
                }

                function checkRefAndSet(res) {
                    return self._q.when(res.path)
                        .then(setPathAndRef)
                        .catch(function() {
                            self._q.reject(("argument is not a firebaseRef"));
                        });

                    function setPathAndRef(path) {
                        fire._currentRef = res;
                        setCurrentPath(path);
                        return fire._currentRef;
                    }
                }
            }

            function setCurrentPath(ref) {
                var path;
                if (angular.isString(fire._currentPath)) {
                    setPathHistory(fire._currentPath);
                }
                fire._currentPath = path;
                return fire._currentPath;
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

            function extendPath(arr, id) {
                return self._utils.extendPath(arr, id);
            }

            function arrayify(param) {
                return self._utils.arrayify(param);
            }

            function stringify(arr) {
                return self._utils.stringify(arr);
            }

            function relativePath(path) {
                return stringify(arrayify(removeSlash(path)))
            }

            function fullPath(path) {
                return rootPath() + relativePath(path);
            }

            function removeSlash(path) {
                return self._utils.removeSlash(path);
            }

            function flatten(arr) {
                return self._utils.flatten(arr);
            }

            function inspect() {
                return self;
            }

            self._fire = fire;
            return self._fire;
        }
    };

}.call(this));
