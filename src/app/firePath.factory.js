(function() {
    "use strict";
    var FirePath;

    angular.module("firebase.fuel")
        .factory("firePath", firePathFactory);

    /** @ngInject */
    function firePathFactory(utils, $window, $q, $log, $injector, fireStarter) {

        return function(path, options, constant) {
            var fb = new FirePath(utils, $window, $q, $log, $injector, fireStarter, path, options, constant);
            return fb.construct();

        };

    }

    FirePath = function(utils, $window, $q, $log, $injector, fireStarter, path, options, constant) {
        this._utils = utils;
        this._window = $window;
        this._q = $q;
        this._log = $log;
        this._injector = $injector;
        this._path = path;
        this._fireStarter = fireStarter;
        this._options = options || null;
        this._constant = constant || "FBURL";
        this._rootPath = this._injector.get(this._constant);
        if (!angular.isString(this._rootPath)) {
            throw new Error("You must provide a root path, either by a constant 'FBURL' or by providing a service name to inject");
        }
        this._const = undefined;
        if (this._constant !== "FBURL") {
            this._const = this._constant;
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
                this._locationName = this._options.locationName || "locations";
                this._geofireName = this._options.geofireName || "geofire";
            }
        }
    };


    FirePath.prototype = {
        construct: function() {
            var self = this;
            var fire = {};

            fire.rootRef = root;
            fire.mainRef = mainRef;
            fire.mainArray = mainArray;
            fire.mainRecord = mainRecord;
            fire.nestedArray = nestedArray;
            fire.nestedRecord = nestedRecord;
            fire.nestedRef = nestedRef;
            fire.indexAf = indexAf;
            fire.main = main;

            //TODO make below private
            fire.build = build;

            fire._pathHistory = [];
            fire.currentBase = getCurrentFirebase;
            fire.currentRef = getCurrentRef;
            fire.currentPath = getCurrentPath;
            fire.currentParentRef = getCurrentParentRef;
            fire.currentParentPath = getCurrentParentPath;
            fire.pathHistory = getPathHistory;
            fire.setChild = setChild;
            fire.isInMainNode = isInMainNode;

            fire.setCurrentRef = setCurrentRef;
            fire.inspect = inspect;

            if (self._geofire === true) {
                fire.makeGeo = makeGeo;
            }

            setCurrentRef(main())

            /*************** firebaseRefs ************/

            function build(path, type, flag) {
                var ref, str;
                switch (flag) {
                    case true:
                        ref = setFire(type, path);
                        break;
                    default:
                        switch (isInMainNode(path)) {
                            case true:
                                return setFire(type, setChild(path));
                            case false:
                                throw new Error("You cannot switch to a new main node");
                        }
                }

                // case getCurrentPath():
                //     self._log.info("Reusing currentRef");
                //     ref = getCurrentRef();
                //     break;
                // case getCurrentParentPath():
                //     self._log.info("Using currentParentRef");
                //     ref = getCurrentParentRef();
                //     self._log.info(nodeIdx(str));
                //     break;
                // default:
                //     if (isCurrentChild(str)) {
                //         self._log.info("Building childRef");
                // ref = buildChildRef(str);
                // } else if (isInMainNode(str)) {

            }

            function setFire(type, res) {
                if (angular.isDefined(type)) {
                    return buildFire(type, setCurrentRef(res), true);
                } else {
                    return setCurrentRef(res);
                }
            }

            function isInMainNode(path) {
                return fullPath(path).search(mainPath()) > -1;
            }

            function isChild(path) {
                return fullPath(path).length > mainPath().length;
            }

            function setChild(path) {
                path = path.slice(mainPath().length);
                return main().child(relativePath(path));
            }

            function buildFire(type, path, flag) {

                return self._q.when(self._fireStarter(type, path, flag, self._const))
                    .then(setCurrentRefAndReturn)
                    .catch(standardError);

                function setCurrentRefAndReturn(res) {
                    setCurrentFirebase(res);
                    return res;
                }
            }

            function root() {
                return new self._window.Firebase(rootPath());
            }

            function main() {
                return root().child(relativePath(self._path));
            }

            function mainPath() {
                return main().toString();
            }

            function mainArray() {
                return build(mainPath(), "ARRAY");
            }

            function mainRef() {
                return build(mainPath());
            }

            function mainRecord(id) {
                return build(mainRecordPath(id), "OBJECT");
            }

            function nestedRef(recId, name) {
                return build(nestedArrayPath(recId, name));
            }

            function nestedArray(recId, name) {
                return build(nestedArrayPath(recId, name), "ARRAY");
            }

            function nestedRecord(mainRecId, arrName, recId) {
                return build(nestedRecordPath(mainRecId, arrName, recId), "OBJECT");
            }

            function indexAf(recId, name, type) {
                return build(nestedArrayPath(recId, name), type);

            }

            /* Geofire refs */
            function makeGeo(path) {
                return build(geofireArrayPath([self._path, path]), "geo");
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

            function userIndexPath() {
                return arrayify([self._userName, sessionId(), self._path]);
            }

            function geofireArrayPath(path) {
                return arrayify(path);
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
                if (angular.isUndefined(str)) {
                    return relativePathArray(path);
                } else {
                    return relativePathArray(path).indexOf(str);
                }
            }

            // function isCurrentChild(path) {
            //     var pathSub;
            //     pathSub = path.substring(0, getCurrentPath().length);
            //     if (path.length >= getCurrentPath().length) {
            //         return pathSub === getCurrentPath();
            //     } else {
            //         return false;
            //     }
            // }

            // function buildChildRef(path) {
            //     return getCurrentRef().child(removeSlash(path.slice(getCurrentPath().length)));
            // }

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

            //simple object and array command returns ref;
            //geofire commands do not return anything
            //qAll command returns array; ref wil be first item;
            //
            //queries return fbobject or array - need to call $ref()
            //geofire queries return the values but not a ref;

            // function setCurrentRef(ref) {
            // var path;
            // return checkArray(ref)
            //     .then(checkRefAndSet)
            //     .then(setPathAndRef)
            //     .catch(standardError);

            // function checkArray(res) {
            //     if (Array.isArray(res)) {
            //         // return self._q.when(res[0].$ref())
            //         //     .catch(function() {
            //         //         self._q.reject(("firebaseRef must be first item in the array"));
            //         //     });
            //     } else {
            //         return self._q.when(res);
            //     }
            // }

            // function checkRefAndSet(res) {
            //     return self._q.when(res)
            //         .catch(function() {
            //             self._q.reject(("argument is not a firebaseRef"));
            //         });

            // }

            function setCurrentRef(res) {
                fire._currentRef = res;
                setCurrentPath(res.toString());
                return fire._currentRef;
                // }
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

            function qWrap(obj) {
                return self._q.when(obj);
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
                return self._utils.relativePath(path);
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
