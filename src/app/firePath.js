(function() {
    "use strict";
    var FirePath;

    angular.module("firebase.fuel")
        .provider("firePath", FirePathProvider);

    /** @ngInject */
    function FirePathProvider(fireStarterProvider) {
        var prov = this;

        prov.$get = ["utils", "$q", "$log", "$injector", "fireStarter",
            function firePathFactory(utils, $q, $log, $injector, fireStarter) {

                return function(path, options, constant) {
                    var fb = new FirePath(utils, $q, $log, $injector, fireStarter, path, options, constant);
                    var c = fb.construct();
                    c.reset();
                    return c;

                };

            }
        ];

        FirePath = function(utils, $q, $log, $injector, fireStarter, path, options, constant) {
            this._utils = utils;
            this._q = $q;
            this._log = $log;
            this._injector = $injector;
            this._path = path;
            this._fireStarter = fireStarter;
            this._options = options;
            this._rootPath = constant;
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
                this._locationNode = this._options.locationNode;
                this._geofireNode = this._options.geofireNode;
            }
        };


        FirePath.prototype = {
            construct: function() {
                var self = this;
                var fire = {};

                fire.main = main;
                fire.reset = reset;
                fire.nestedRef = nestedRef;
                fire.root = root;
                fire.mainArray = mainArray;
                fire.mainRecord = mainRecord;
                fire.nestedArray = nestedArray;
                fire.nestedRecord = nestedRecord;
                fire.indexAf = indexAf;

                fire.build = build;

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

                if (self._geofire === true) {
                    fire.makeGeo = makeGeo;
                }


                /*************** Constructor ************/

                function build(path, type) {
                    switch (isInMainNode(path)) {
                        case false:
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

                function completeBuild(res) {
                    return buildFire(res[1], res[0], true);
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
                        default:
                            //TODO fix so dynamically calls parent() based on idx
                            reset();
                            throw new Error("Too deep - construct again");
                    }
                }


                function buildFire(type, path, flag) {

                    return self._q.when(self._fireStarter(type, path, flag, self._rootPath))
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
                    return self._fireStarter("ref", [self._path], null, self._rootPath);
                }

                function nestedRef(recId, name) {
                    return build(nestedArrayPath(recId, name));
                }

                function reset() {
                    return setCurrentRef(main());
                }

                /*************** angularFire ************/

                function mainArray() {
                    return build(self._path, "array");
                }

                function mainRecord(id) {
                    return build(mainRecordPath(id), "object");
                }

                function nestedArray(recId, name) {
                    return build(nestedArrayPath(recId, name), "array");
                }

                function nestedRecord(mainRecId, arrName, recId) {
                    return build(nestedRecordPath(mainRecId, arrName, recId), "object");
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
                    return fullPath(self._path);
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
                    return self._utils.stringify([rootPath(), self._utils.relativePath(path)]);
                }

                function inspect() {
                    return self;
                }

                self._fire = fire;
                return self._fire;
            }
        };
    }
}.call(this));
