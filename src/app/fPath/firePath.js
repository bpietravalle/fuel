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

            // function rootPath() {
            //     return root().toString();
            // }

            // function mainPath() {
            //     return reset().toString();
            // }

            // function sessionId() {
            //     return self._sessionObject[self._sessionIdMethod]();
            // }

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
