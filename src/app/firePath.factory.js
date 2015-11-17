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

            fire.main = main;
            fire.nestedRef = nestedRef;
            fire.rootRef = root;
            fire.mainArray = mainArray;
            fire.mainRecord = mainRecord;
            fire.nestedArray = nestedArray;
            fire.nestedRecord = nestedRecord;
            fire.indexAf = indexAf;

            fire.build = build;

            fire._pathHistory = [];
            fire.base = getCurrentFirebase;
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

            setCurrentRef(main())


            /*************** Constructor ************/

            function build(path, type) {
                switch (isInMainNode(path)) {
                    case false:
                        throw new Error("You cannot switch to a new main node");
                    case true:
                        switch (type) {
                            case undefined:
                                return nextRef(path, true);
                            default:
                                return buildFire(type, nextRef(path), true);
                        }
                }
            }


            function isInMainNode(path) {
                return fullPath(path).search(mainPath()) > -1;
            }



            function nextRef(param, flag) {
                if (flag === true) {
                    return setCurrentRef(param);
                }
                switch (nodeComp(param) < 0) {
                    case true:
                        return setCurrentRef(getCurrentRef().child(setChild(param)));
                    case false:
                        return setCurrentRef(useCurrent(nodeComp(param)));
                }
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
                        throw new Error("Too deep");
                }
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


            /*************** firebaseRefs ************/

            function root() {
                return new self._window.Firebase(rootPath());
            }

            function main() {
                return root().child(self._utils.relativePath(self._path));
            }

            function nestedRef(recId, name) {
                return build(nestedArrayPath(recId, name));
            }

            /*************** angularFire ************/

            function mainArray() {
                return build(self._path, "ARRAY");
            }

            function mainRecord(id) {
                return build(mainRecordPath(id), "OBJECT");
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

            /*************** geoFire ***************/

            function makeGeo(path) {
                return build(self._utils.toArray([self._path, path]), "geo");
            }


            /************ Absolute Paths ****************/


            function rootPath() {
                return self._utils.removeSlash(self._rootPath);
            }

            function mainPath() {
                return main().toString();
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
                return self._sessionStorage[self._sessionIdMethod]();
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

            function setCurrentPath(ref) {
                var path;
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
                return rootPath() + self._utils.relativePath(path);
            }

            function inspect() {
                return self;
            }

            self._fire = fire;
            return self._fire;
        }
    };

}.call(this));
