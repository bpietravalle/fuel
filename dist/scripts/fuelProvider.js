(function() {
    'use strict';

    angular
        .module('firebase.fuel', ['firebase.fuel.config', 'firebase.fuel.services']);

    angular
        .module('firebase.fuel.services', ['firebase.fuel.utils','firebase.fuel.logger', 'firebase.fuel.config']);

})();

(function() {
  'use strict';

  config.$inject = ["$logProvider"];
  angular
    .module('firebase.fuel')
    .config(config);

  /** @ngInject */
  function config($logProvider) {

    $logProvider.debugEnabled(true);

  }

})();

(function() {
    "use strict";

    /** @ngInject */
    authObjFactory.$inject = ["fuelConfiguration"];
    function authObjFactory(fuelConfiguration) {
        return fuelConfiguration("auth");
    }

    angular.module("firebase.fuel.services")
        .factory("fuelAuth", authObjFactory);
})();

(function() {
    "use strict";

    /** @ngInject */
    loggerFactory.$inject = ["$log"];
    function loggerFactory($log) {
			//unused currently

        return {

            info: info



        }

        function info(data) {
            $log.info(data);
        }


    }

    angular.module("firebase.fuel.logger",[])
        .factory("logger", loggerFactory);
})();

(function() {
    "use strict";


    utilsFactory.$inject = ["$log", "$q", "inflector"];
    angular.module("firebase.fuel.utils", ['platanus.inflector'])
        .factory("utils", utilsFactory);


    /** @ngInject */
    function utilsFactory($log, $q, inflector) {

        var utils = {
            addTimeAtCreate: addTimeAtCreate,
            addTimeAtSave: addTimeAtSave,
            camelize: camelize,
            extendPath: extendPath,
            flatten: flatten,
            nextPath: nextPath,
            nodeIdx: setNodeIdx,
            paramCheck: paramCheck,
            paramNodeIdx: removeMainPath,
            pluralize: pluralize,
            qWrap: qWrap,
            qAll: qAll,
            qAllResult: qAllResult,
            relativePath: relativePath,
            removeSlash: removeSlash,
            standardError: standardError,
            singularize: singularize,
            stringify: stringify,
            toArray: toArray
        };

        return utils;

        function strCheck(str) {
            switch (angular.isString(str)) {
                case true:
                    switch (str.length < 100) {
                        case true:
                            return str;
                        case false:
                            return invalidLen(str);
                    }
                    break;
                case false:
                    return invalidType(str);
            }
        }

        function arrCheck(arr) {
            switch (angular.isArray(arr)) {
                case true:
                    return arr;

                case false:
                    return invalidType(arr);
            }
        }

        function boolCheck(bool) {
            var accepted = [false, true];
            switch (accepted.indexOf(bool)) {
                case -1:
                    return invalidType(bool);
                default:
                    return bool;

            }
        }

        function invalidType(type) {
            throw new Error("Invalid parameter type at: " + type);
        }

        function invalidLen(len) {
            throw new Error("Invalid parameter length at: " + len);
        }

        function paramCheck(param, fn, d) {
            switch (angular.isUndefined(param)) {
                case true:
                    return d;
                case false:
                    switch (fn) {
                        case "bool":
                            return boolCheck(param);
                        case "str":
                            return strCheck(param);
                        case "arr":
                            return arrCheck(param);
                        case "obj":
                            return hashCheck(param);
                    }
            }
        }

        function hashCheck(hash) {
            //TODO: iterate over keys and check for and remove unknowns
            return hash;
        }

        function camelize(str, flag) {
            return inflector.camelize(str, flag);
        }

        function singularize(str) {
            return inflector.singularize(str);
        }

        function pluralize(str) {
            return inflector.pluralize(str);
        }

        function qWrap(obj) {
            return $q.when(obj);
        }

        function qAll(x, y) {
            return $q.all([x, qWrap(y)]);
        }

        function qAllResult(res) {
            if (res.length) {
                $log.info("flattening results");
                return flatten(res);
            } else {
                return res;
            }
        }


        function standardError(err) {
            return $q.reject(err);
        }

        function relativePath(path) {
            return stringify(toArray(removeSlash(path)));
        }

        function removeSlash(path) {
            if (path[path.length - 1] === "/") {
                path = path.substring(0, path.length - 1);
            }
            if (path[0] === "/") {
                path = path.substring(1);
            }
            return path;
        }

        function flatten(arr) {
            var flatResults = arr.reduce(function(x, y) {
                return x.concat(y);
            }, []);
            return flatResults;
        }

        function toArray(param) {
            if (angular.isArray(param)) {
                return flatten(param);
            } else {
                return extendPath([], param);
            }
        }

        function stringify(arr) {
            if (angular.isArray(arr)) {
                arr = arr.join('/');
            }
            return arr;
        }

        //TODO this only works if undefined is last item in array
        function extendPath(arr, id) {
            arr.push(id);
            arr = flatten(arr);
            var un = arr.indexOf(undefined);
            if (un > -1) {
                arr.splice(un, 1);
            }

            return arr;
        }

        function setNodeIdx(path, main) {
            path = removeSlash(path).slice(removeSlash(main).length);
            path = path.split('/');
            if (path[0] === "") {
                path.shift();
            }
            return path;
        }



        /* @param {array} ["currentpath","relative","to","main"]
         * @param {array} ["pathParm","relative","to","main"]
         * @return {array} [Int - idx of deepest shared node, string - remaining childpath if any]
         *
         */


        function nextPath(current, param) {

            var parent = [];
            var child = [];

            param.forEach(function(val, idx) {
                if (val === current[idx]) {
                    parent.push(val);
                } else {
                    child.push(val);
                }
            });


            if (child.length > 0) {
                child = stringify(child);
            }

            return child;

        }

        function removeMainPath(path, main) {
            path = toArray(path);
            if (path[0] === main) {
                path.shift();
            }
            return path;

        }


        function addTimeAtCreate(obj, createtime, updatetime) {
            obj[createtime] = timeStamp();
            obj[updatetime] = timeStamp();

            return obj;
        }

        function addTimeAtSave(obj, updatetime) {
            obj[updatetime] = timeStamp();

            return obj;
        }

        function timeStamp() {
            return Firebase.ServerValue.TIMESTAMP;
        }

    }



})();

(function() {
    "use strict";

    FuelConfigProvider.$inject = ["fireStarterProvider"];
    angular.module('firebase.fuel.config', ['firebase.starter'])

    .provider('fuelConfiguration', FuelConfigProvider);

    function FuelConfigProvider(fireStarterProvider) {
        var prov = this;
        prov.setRoot = function(val) {
            fireStarterProvider.setRoot(val);
        }
        prov.getRoot = function() {
            return fireStarterProvider.getRoot();
        }

        prov.$get = ["fireStarter",
            function(fireStarter) {
                switch (angular.isString(prov.getRoot())) {
                    case true:
                        return function(type, path, options) {
                            return fireStarter(type, path, options)
                        };
                    case false:
                        throw new Error("You must define a root url in your module's config block");
                }
            }
        ];
    }


})();

(function() {
    "use strict";
    FirePathFactory.$inject = ["$timeout", "utils", "$q", "$log", "$injector", "fuelConfiguration"];
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
        this._geofire = this._options.geofire
    };


    FirePath.prototype = {
        construct: function() {
            var self = this;
            var fire = {};

            fire.reset = reset;
            fire.root = root;

            fire.main = main;
            fire.mainRecordRef = mainRecordRef;
            fire.nestedArrayRef = nestedArrayRef;
            fire.nestedRecordRef = nestedRecordRef;

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
                        geofirePath: geofirePath,
                        geofireRef: geofireRef,
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

(function() {
    "use strict";
    FuelFactory.$inject = ["$timeout", "utils", "firePath", "$q", "$log", "$injector"];
    var Fuel;

    angular
        .module('firebase.fuel.services')
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
        this._options = this._utils.paramCheck(options, "obj", {});
        this._pathOptions = {};

        /*Core Options */
        this._geofire = this._utils.paramCheck(this._options.geofire, "bool", false);
        this._gps = this._utils.paramCheck(this._options.gps, "bool", false);
        this._nestedArrays = this._utils.paramCheck(this._options.nestedArrays, "arr", []);
        this._session = this._utils.paramCheck(this._options.session, "bool", false);
        this._user = this._utils.paramCheck(this._options.user, "bool", false);
        this._timeStamp = this._utils.paramCheck(this._options.timeStamp, "bool", false);
        if (this._gps === true && this._geofire === true) {
            throw new Error("Invalid options. Please remove either 'gps' or 'geofire' from the options hash");
        }
        if (this._user === true && this._geofire === true) {
            throw new Error("Invalid options  Please remove 'user' or 'geofire' from your options hash.");
        }

        /******************
         * Additional Config
         * *****************/

        /* GPS & Geofire */
        if (this._gps === true || this._geofire === true) {

            this._geofireNode = this._utils.paramCheck(this._options.geofireNode, "str", "geofire");
            this._latitude = this._utils.paramCheck(this._options.latitude, "str", "lat");
            this._longitude = this._utils.paramCheck(this._options.longitude, "str", "lon");

            this._pathOptions.geofire = true;
        }


        if (this._geofire === true) {
            this._foreignKeys = this._utils.paramCheck(this._options.foreignKeys, "obj", {});
        }

        if (this._gps === true) {
            this._addRecordKey = this._utils.paramCheck(this._options.addRecordKey, "bool", true);
            this._points = this._utils.paramCheck(this._options.points, "str", this._path);
            this._geofireIndex = this._utils.paramCheck(this._options.geofireIndex, "str", "locations");
            this._geofireService = this._utils.paramCheck(this._options.geofireService, "str", "geofire");
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
            entity.inspect = inspect;

            entity.mainRef = mainRef;
            entity.mainArray = mainArray;
            entity.mainRecord = mainRecord;

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
                entity.geoQuery = geoQuery;
                entity.removeCoords = removeCoords;
                entity.setCoords = setCoords;
                entity.getCoords = getCoords;
                entity.getLocation = getLocationRecord;
                entity.addLocations = sendToGeofireToAdd;
                entity.removeLocations = sendToGeofireToRemove;



                if (self._addRecordKey === true) {
                    entity.loadRecordLocations = sendToGeoFireToLoadLocations;
                }
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
                entity.session = session;
                entity.sessionId = sessionId;
            }

            if (self._geofire === true) {
                entity.add = addLocations;
                entity.addRecordKey = addRecordKey;
                entity.geofire = makeGeofire;
                entity.get = getGeofire;
                entity.loadRecordLocations = loadRecordLocations;
                entity.query = queryGeofire;
                entity.remove = removeLocations;
                entity.set = setGeofire;
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

            function getCurrentBase() {
                return self._pathMaster.base();
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

            function nestedArrayRef(id, name) {
                return self._pathMaster.nestedArrayRef(id, name);
            }

            function indexAf(id, name, type) {
                return self._pathMaster.indexAf(id, name, type);
            }

            function nestedRecord(mainId, name, recId) {
                return self._pathMaster.nestedRecord(mainId, name, recId);
            }

            function buildFire(type, path, flag) {
                return self._pathMaster.buildFire(type, path, flag);
            }

            /* Geofire Interface */

            function makeGeofire(path) {
                return self._pathMaster.makeGeofire(path);
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
                    .catch(standardError);
            }

            function loadMainRecord(id) {
                return mainRecord(id)
                    .then(loaded)
                    .catch(standardError);
            }

            function loadUserRecords() {
                return currentUserRecords()
                    .then(wrapQuery)
                    .then(loaded)
                    .catch(standardError);
            }

            function loadRecordLocations(prop, id) {
                return currentRecordLocations(prop, id)
                    .then(wrapQuery)
                    .then(loaded)
                    .catch(standardError);
            }

            function getMainRecord(key) {
                return qAll(loadMainArray(), key)
                    .then(getRecord)
                    .catch(standardError);
            }

            function currentRecordLocations(prop, id) {
                return queryByChild(prop, id);
            }

            function currentUserRecords() {
                return queryByChild(self._uidProperty, sessionId());
            }

            function queryByChild(key, val) {
                return qAll(mainRef(), [key, val])
                    .then(completeQuery)
                    .catch(standardError);

                function completeQuery(res) {
                    return res[0].orderByChild(res[1][0]).equalTo(res[1][1]);
                }
            }

            /* Commands */
            function addIndex(recId, arrName, key) {

                if (!angular.isString(recId) && self._session === true) {
                    recId = sessionId();
                }
                return qAll(nestedArrayRef(recId, arrName), key)
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

                return qAll(nestedArrayRef(recId, arrName), key)
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
                    .catch(standardError);
            }

            function removeMainRecord(key) {

                return checkParam(key)
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
                    .catch(standardError);
            }

            /************
             * GPS Option
             * ***********/

            /* @param{Object} obj
             *
             * @param{Object|Array} obj.data locations to save
             * @param{Boolean} obj.flag true if only wish to save coordinates, otherwise leave undefined
             * @param{String} obj.path child node for coordinates
             * @param{Object|String} obj.[id] if the main record already exists pass its firebaseRef or key and method will
             * add indexes - optional
             * @return{Array} [fireBaseRef of mainlocation]
             */

            function sendToGeofireToAdd(obj) {
                if (!obj.path) {
                    obj.path = self._points;
                }
                if (!obj.flag) {
                    obj.flag = null;
                }
                switch (!obj.id) {
                    case true:
                        return self._geofireObject.add(obj.data, obj.flag, obj.path);
                    default:
                        return self._geofireObject.add(obj.data, obj.flag, obj.path)
                            .then(setReturnVal)
                            .then(addLocationIndices)
                            .catch(standardError);

                }

                function setReturnVal(res) {
                    var arr = []
                    arr.push(obj.id);
                    arr.push(res);
                    self._log.info(arr);
                    return arr;
                }
            }



            /* @param{Object} obj
             *
             * @param{String} obj.id "mainRecordId"
             * @param{Boolean} obj.flag true if only wish to remove coordinates, otherwise leave undefined
             * @param{String} obj.path child node for coordinates
             * @param{Array} [obj.locKeys] ["array","or","locationIds"] - optional
             * @return{Array} [fireBaseRefs of removed main location records]
             */

            function sendToGeofireToRemove(obj) {
                if (!obj.path) {
                    obj.path = self._points;
                }
                if (!obj.flag) {
                    obj.flag = null;
                }
                switch (!obj.locKeys) {
                    case true:
                        return getIndexKeys(obj.id, self._geofireIndex)
                            .then(completeRemove)
                    default:
                        return completeRemove(obj.locKeys)
                            .then(removeLocIndices)
                }

                function completeRemove(res) {
                    return self._geofireObject.remove(res, obj.flag, obj.path);
                }

                function removeLocIndices(res) {
                    return self._q.all(res.map(function(loc) {
                        return removeIndex(obj.id, self._geofireIndex, loc.key());

                    }));
                }

            }

            function addKeyToLocation(locKey, fKey) {
                switch (self._addRecordKey) {
                    case true:
                        return self._geofireObject.addRecordKey(self._points, locKey, fKey);
                    default:
                        null;
                }
            }

            function sendToGeoFireToLoadLocations(prop, id) {
                return self._geofireObject.loadRecordLocations(prop, id);
            }

            function setCoords(key, coords, pth) {
                if (!pth) {
                    pth = self._points;
                }
                return self._geofireObject.set(key, coords, pth);
            }

            function getCoords(key, pth) {
                if (!pth) {
                    pth = self._points;
                }
                return self._geofireObject.get(key, pth);
            }

            function removeCoords(key, pth) {
                if (!pth) {
                    pth = self._points;
                }
                return self._geofireObject.remove(key, true, pth);
            }

            function geoQuery(obj, pth) {
                if (!pth) {
                    pth = self._points;
                }
                return self._geofireObject.query(obj, pth);
            }

            /*****************
             * Geofire Option
             * ***************/

            /* @param{Object|Array} 
             * @param{Boolean} true if only wish to save coordinates, otherwise leave undefined
             * @return{Array} firebaseRefs of created records
             */

            function addLocations(locs, flag, path) {
                if (!angular.isArray(locs)) {
                    locs = [locs];
                }

                return self._q.all(locs.map(function(loc) {
                    return addLocation(loc, flag, path);
                }));
            }

            /* @param{Array|String} 
             * @param{Boolean} true if only wish to save coordinates, otherwise leave undefined
             * @return{Array} firebaseRefs of deleted main array record
             */

            function removeLocations(keys, flag, path) {
                if (!angular.isArray(keys)) {
                    keys = [keys];
                }

                return self._q.all(keys.map(function(key) {
                    return removeLocation(key, flag, path);
                }));
            }


            function addLocation(data, flag, path) {
                switch (flag) {
                    case true:
                        return setGeofire(data[0], data[1], path)
                            .catch(standardError);
                    default:
                        return addFullLocationRecord(data, path)
                            .catch(standardError);
                }
            }

            function removeLocation(key, flag, path) {
                switch (flag) {
                    case true:
                        return removeGeofire(key, path)
                            .catch(standardError);
                    default:
                        return removeFullLocationRecord(key, path)
                            .catch(standardError);
                }

            }

            function addFullLocationRecord(data, path) {
                var coords = {
                    lat: data[self._latitude],
                    lon: data[self._longitude]
                };

                return qAll(createMainRecord(data, true), coords)
                    .then(setAndPass)
                    .then(setReturnValueToSecond)
                    .catch(standardError);

                function setAndPass(res) {
                    return qAll(setGeofire(res[0].key(), [res[1].lat, res[1].lon], path), res[0]);
                }

            }

            function removeFullLocationRecord(key, path) {
                return self._q.all([removeMainRecord(key), removeGeofire(key, path)])
                    .then(setReturnValueToFirst)
                    .catch(standardError);
            }


            function getGeofire(key, path) {
                return qAll(makeGeofire(path), key)
                    .then(getGeo)
                    .catch(standardError);
            }

            function queryGeofire(data, path) {
                return qAll(makeGeofire(path), data)
                    .then(queryGeo)
                    .catch(standardError);
            }

            function removeGeofire(key, path) {
                return qAll(makeGeofire(path), key)
                    .then(removeGeo)
                    .catch(standardError);
            }

            function setGeofire(key, coords, path) {
                return qAll(makeGeofire(path), [key, coords])
                    .then(setGeo)
                    .catch(standardError);
            }

            function addRecordKey(path, locKey, fKey) {
                var prop = self._foreignKeys[path];
                switch (!angular.isString(prop)) {
                    case true:
                        throw new Error("Invalid key: Please check options defined for your Geofire service");
                    case false:
                        return mainRef()
                            .then(updateLocationRecord)
                            .catch(standardError);
                }

                function updateLocationRecord(res) {
                    return self._timeout(function() {
                        var obj = {};
                        obj[prop] = fKey;
                        return res.child(locKey).update(obj);
                    });
                }
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

            }

            //TODO add method to update locationRecord with mainrecord id - see below;

            function createWithGps(data, loc) {
                return self._q.all([createMainRecord(data), sendToGeofireToAdd({
                        data: loc
                    })])
                    .then(addLocationIndexAndPassKey)
                    .then(setReturnValue)
                    .catch(standardError);

                function addLocationIndexAndPassKey(res) {
                    return qAll(addLocationIndices(res), res[0]);
                }

                function setReturnValue(res) {
                    return res[1];
                }
            }

            /**
             * @param{Array} arr
             * @param{Object} arr[0] firebaseRef of Record that has the associated location data
             * @param{Array} arr[1] array of firebaseRef of newly persisted locations
             * @return{Array} array of location index, firebaseref of location record
             * @summary creates indexes of persisted locations and, unless you've opted out of 'addREcordKey option
             * this will add this record key to the location record as well
             *
             */

            function addLocationIndices(arr) {
                if (!angular.isString(arr[0])) {
                    arr[0] = arr[0].key();
                }
                return self._q.all(arr[1].map(function(loc) {

                    return qAll(addIndex(arr[0], self._geofireIndex, loc.key()), addKeyToLocation(loc.key(), arr[0]));
                }));
            }

            function removeWithGps(mainRecId) {

                return qAll(sendToGeofireToRemove({
                        id: mainRecId
                    }), mainRecId)
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

            //TODO add method to update locationRecord with mainrecord id - see below;
            function createWithUserAndGps(data, loc) {

                return self._q.all([createWithUser(data), sendToGeofireToAdd({
                        data: loc
                    })])
                    .then(addLocationIndexAndPassKey)
                    .then(setReturnValue)
                    .catch(standardError);

                function addLocationIndexAndPassKey(res) {
                    /*mainkey,geofire Obj*/
                    return self._q.all([addLocationIndices([res[0][1], res[1]]), res[0][1]]);
                }

                function setReturnValue(res) {
                    return res[1];
                }
            }

            function getLocationRecord(id) {
                return self._geofireObject
                    .mainRecord(id)
            }

            function removeWithUserAndGps(mainRecId) {

                return qAll(sendToGeofireToRemove({
                        id: mainRecId
                    }), mainRecId)
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
                var arrName, recName, addRec, getRec, removeRec, loadRec, loadRecs, saveRec, newProp;
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
                        .catch(standardError);
                };

                newProp[getRec] = function(key, id) {

                    return qAll(newProp[arrName](id), key)
                        .then(getRecord)
                        .catch(standardError);
                };

                newProp[removeRec] = function(key, id) {
                    return newProp[recName](key, id)
                        .then(remove)
                        .catch(standardError);
                };
                newProp[loadRec] = function(id, idxOrRec) {
                    return newProp[recName](id, idxOrRec)
                        .then(loaded)
                        .catch(standardError);
                };

                newProp[loadRecs] = function(id) {
                    return newProp[arrName](id)
                        .then(loaded)
                        .catch(standardError);
                };

                newProp[saveRec] = function(rec) {
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
                if (angular.isArray(res)) {
                    return res[0].$remove(res[1]);
                } else {
                    return res.$remove();
                }
            }

            function save(res) {
                switch (angular.isArray(res)) {
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
                            break;
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
                                    break;
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

            function setReturnValueToFirst(res) {
                return self._timeout(function() {
                    return res[0];
                });
            }

            function setReturnValueToSecond(res) {
                return self._timeout(function() {
                    return res[1];
                });
            }

            function wrapQuery(res) {
                return buildFire("array", res, true);
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

            function qAll(x, y) {
                return self._utils.qAll(x, y);
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
