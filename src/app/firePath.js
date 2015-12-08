(function() {
    "use strict";
    var FirePath;

    angular.module("firebase.fuel.services")
        .factory("firePath", FirePathFactory);

    /** ngInject*/
    function FirePathFactory(utils, $q, $log, $injector, fuelConfiguration) {
        return function(path, options) {
            var fb = new FirePath(utils, $q, $log, $injector, fuelConfiguration, path, options);
            var c = fb.construct();
            c.reset();
            return c;

        };

    }

    FirePath = function(utils, $q, $log, $injector, fuelConfiguration, path, options) {
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
            this._points = this._options.points;
        }
    };


    FirePath.prototype = {
        construct: function() {
            var self = this;
            var fire = {};

            fire.main = main;
            fire.reset = reset;
            fire.nestedRef = nestedArrayRef;
            fire.root = root;
            fire.mainArray = mainArray;
            fire.mainRecord = mainRecord;
            fire.nestedArray = nestedArray;
            fire.nestedRecord = nestedRecord;
            fire.indexAf = indexAf;

            fire.build = build;
            fire.buildFire = buildFire;

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

            switch (self._geofire) {
                case true:
                    return angular.extend(fire, {
                        makeGeofire: makeGeofire
                    });
            }



            /*************** Constructor ************/

            function build(path, type, flag) {
                switch (isInMainNode(path)) {
                    case false:
                        self._log.info("mainPath");
                        self._log.info(mainPath());
                        self._log.info("fulPath");
                        self._log.info(fullPath(path));
                        self._log.info("args");
                        self._log.info(path);
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
                    case 6:
                        return ref.parent().parent().parent().parent().parent().parent();
                    case 7:
                        return ref.parent().parent().parent().parent().parent().parent().parent();
                    default:
                        //TODO fix so dynamically calls parent() based on idx
                        reset();
                        throw new Error("Too deep - construct again");
                }
            }


            function buildFire(type, path, flag) {

                return self._q.when(self._fuelConfiguration(type, path, flag))
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
                return self._fuelConfiguration("ref", self._path);
            }

            function mainRecordRef(id) {
                return main().child(id);
            }

            function nestedArrayRef(recId, name) {
                return mainRecordRef(recId).child(name);
            }

            function nestedRecordRef(recId, name, id) {
                return nestedArrayRef(recId, name).child(id);
            }

            function reset() {
                return mainArray();
            }

            /*************** angularFire ************/

            function mainArray() {
                return buildFire("array", setCurrentRef(main()), true);
            }

            function mainRecord(id) {
                return buildFire("object", setCurrentRef(mainRecordRef(id)), true);
            }

            function nestedArray(recId, name) {
                return buildFire("array", setCurrentRef(nestedArrayRef(recId,name)), true);
            }

            function nestedRecord(main, arr, rec) {
                return buildFire("object", setCurrentRef(nestedRecordRef(main,arr,rec)), true);
            }

            function indexAf(recId, name, type) {
                return buildFire(type, setCurrentRef(nestedArrayRef(recId, name)), true);
            }

            /*************** geoFire ***************/

            function makeGeofire() {
                return buildFire("geo", setCurrentRef(geofireRef()), true);
            }

            function geofireRef() {
                return mainRecordRef(self._points);
            }

            /************ Absolute Paths ****************/

            function rootPath() {
                return root().toString();
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
                return self._utils.stringify([self._utils.removeSlash(rootPath()), self._utils.relativePath(path)]);
            }

            function inspect() {
                return self;
            }

            self._fire = fire;
            return self._fire;
        }
    };
}.call(this));
