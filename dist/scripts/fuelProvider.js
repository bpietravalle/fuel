(function() {
    'use strict';

    angular
        .module('firebase.fuel.config', ['firebase.starter']);

})();

(function() {
    'use strict';

    angular
        .module('firebase.fuel', ['firebase.fuel.config', 'firebase.fuel.services']);

})();

(function() {
    'use strict';

    angular
        .module('firebase.fuel.services', ['firebase.fuel.utils', 'firebase.fuel.config']);

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
            paramCheck: paramCheck,
            pluralize: pluralize,
            qWrap: qWrap,
            qAll: qAll,
						removeSlash: removeSlash,
            standardError: standardError,
            singularize: singularize,
            stringify: stringify,
            toArray: toArray
        };

        return utils;

        function paramCheck(param, type, def) {
            switch (angular.isUndefined(param)) {
                case true:
                    return def;
                case false:
                    switch (type) {
                        case "bool":
                            return boolCheck(param);
                        case "str":
                            return strCheck(param);
                        case "arr":
                            return arrCheck(param);
                        case "obj":
                            return hashCheck(param);
                    }
                    break;
            }
        }

        function strCheck(str) {
            switch (angular.isString(str)) {
                case true:
                    return str;
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

        function standardError(err) {
            return $q.reject(err);
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

    /** @ngInject */
    authObjFactory.$inject = ["fuelConfiguration"];
    function authObjFactory(fuelConfiguration) {
			/**
			 * @public
			 * @return{Object} - $firebaseAuth service at the rootPath of your firebase
			 */

        return fuelConfiguration("auth");
    }

    angular.module("firebase.fuel.services")
        .factory("fuelAuth", authObjFactory);
})();

(function() {
    "use strict";

    FuelConfigProvider.$inject = ["fireStarterProvider"];
    angular.module('firebase.fuel.config')

    .provider('fuelConfiguration', FuelConfigProvider);

    /**
     * @public
     * @constructor
     * @see {@link https://github.com/bpietravalle/fireStarter}
     */

    /** @ngInject */
    function FuelConfigProvider(fireStarterProvider) {
        fuelProviderGet.$inject = ["fireStarter"];
        var prov = this;
        prov.setRoot = function(val) {
            fireStarterProvider.setRoot(val);
        }
        prov.getRoot = function() {
            return fireStarterProvider.getRoot();
        }

        prov.$get = fuelProviderGet;

        /** @ngInject */
        function fuelProviderGet(fireStarter) {
            switch (angular.isString(prov.getRoot())) {
                case true:
                    return function(type, path, options) {
                        return fireStarter(type, path, options)
                    };
                case false:
                    throw new Error("You must define a root url in your module's config block");
            }
        }
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
						fb = fb.construct();
						return fb;

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
						reset();

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

        /**
         * @constructor
         * @param{Array} path ["path", "to,"child","node"]
         * @param{Object} options - options hash - see below
         */

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
            this._customUserIndex = this._utils.paramCheck(this._options.customUserIndex, "bool", false);
            if (this._customUserIndex) {
                this._userIndexProp = this._options.userIndexProp || true;
            }

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
            entity.save = save;
            entity.addIndex = addIndex;
            entity.removeIndex = removeIndex;

            if (self._user !== true && self._gps !== true && self._geofire !== true) {
                entity.add = basicAdd;
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

            /**
             * @public
             * @return{String} path of most recently created firebaseRef
             */

            function getCurrentPath() {
                return self._pathMaster.path();
            }

            /**
             * @public
             * @return{Object} most recently created firebaseRef
             */

            function getCurrentRef() {
                    return self._pathMaster.ref();
                }
                /**
                 * @public
                 * @return{Object} most recently created angularFire/Geofire object|array
                 */

            function getCurrentBase() {
                return self._pathMaster.base();
            }


            /**
             * @public
             * @return{Promise<Object>} - promise resolves to firebaseRef at the main node(ie rootPath/self._path)
             */

            function mainRef() {
                return self._pathMaster.main();
            }

            /**
             * @public
             * @return{Promise<Array>} - promise resolves to a $firebaseArray of the main node
             */

            function mainArray() {
                return self._pathMaster.mainArray();
            }

            /**
             * @public
             * @param{String} id - key of record you wish to retrieve
             * @return{Promise<Object>} - promise resolves to a $firebaseObject of the given main record
             */

            function mainRecord(id) {
                return self._pathMaster.mainRecord(id);
            }

            /* Geofire Interface */

            /**
             * @public
             * @param{String} path - child node of geofire node
             * @return{Promise<Object>} - promise resolves to a geofire object
             *
             */

            function makeGeofire(path) {
                return self._pathMaster.makeGeofire(path);
            }

            /*****************
             * Main Methods
             * ***************/

            /*Queries*/

            /**
             * @public
             * @param{String} recId - id of main record
             * @param{String} arrName - name of index
             * @return{Promise<Array>} - promise resolves to ["keys","presently","in" "index"]
             */

            function getIndexKeys(recId, arrName) {
                return indexAf(recId, arrName, "array")
                    .then(loaded)
                    .then(getKeys)
                    .catch(standardError);

                function getKeys(res) {

                    var arr = [];
                    self._q.all(res.map(function(item) {
                        arr.push(item.$id);
                    }));
                    return arr;
                }
            }

            /**
             * @public
             * @param{String} [id] - key of main record you wish to load; without id argument fn will load entire main array
             * @return{Promise<Object|Array>}  - promise resolves to a $firebaseObject or $firebaseArray
             */

            function load(id) {
                switch (angular.isUndefined(id)) {
                    case true:
                        return loadMainArray();
                    case false:
                        return loadMainRecord(id);
                }
            }

            /**
             * @public
             * @param{String|Array} param - either "key" or [$firebaseArray,"key"]
             * @return{Promise<Object>}  - promise resolves to the given $firebaseArray record
             */

            function getMainRecord(param) {
                switch (angular.isArray(param)) {
                    case true:
                        return getRecord(param);
                    case false:
                        switch (angular.isString(param)) {
                            case true:
                                return loadArrayAndGet(param);
                            case false:
                                return standardError("Invalid type:  must pass an array or string");

                        }
                }
            }


            /**
             * @public
             * @param{String} col - property name used in an 'orderByChild' query;
             * @param{String|Number|etc} val - value of child - ie arg of equalTo
             * @return{Promise<firebaseRef>} promise resolves to a firebaseRef the given query
             */

            function queryByChild(col, val) {
                return qAll(mainRef(), [col, val])
                    .then(completeQuery)
                    .catch(standardError);

                function completeQuery(res) {
                    return res[0].orderByChild(res[1][0]).equalTo(res[1][1]);
                }
            }

            /* Commands */

            /**
             * @public
             * @param{String} recId - key of main record - you can leave it undefined if you've
             * configured option hash to use your app's session object
             * @param{String} idxName - name of index
             * @param{String} key  - foreign key to add to index
             * @param{Any} [val=true] - value to set at index - defaults to true
             * @return{Promise<Object>} promise resolves to the firebaseRef of the index
             */

            function addIndex(recId, idxName, key, val) {

                if (!angular.isString(recId) && self._session === true) {
                    recId = sessionId();
                }
                return qAll(nestedArrayRef(recId, idxName), key)
                    .then(completeAction)
                    .catch(standardError);

                function completeAction(res) {
                    if (!val) {
                        val = true;
                    }
                    return self._timeout(function() {
                            return qAll(res[0], res[0].child(res[1]).set(val))
                        })
                        .then(setReturnValueToFirst)
                        .catch(standardError);
                }
            }

            /**
             * @public
             * @param{String} recId - key of main record - you can leave it undefined if you've
             * configured option hash to use your app's session object
             * @param{String} idxName - name of index
             * @param{String} key  - foreign key to remove from  index
             * @return{Promise<Object>} promise resolves to the firebaseRef of the index
             */

            function removeIndex(recId, idxName, key) {

                if (!angular.isString(recId) && self._session === true) {
                    recId = sessionId();
                }

                return qAll(nestedArrayRef(recId, idxName), key)
                    .then(completeAction)
                    .catch(standardError);

                function completeAction(res) {
                    return self._timeout(function() {
                            return qAll(res[0], res[0].child(res[1]).set(null))
                        })
                        .then(setReturnValueToFirst)
                        .catch(standardError);
                }
            }

            /**
             * @public
             * @param{String|Object} id either key of main record or the actual $firebaseObject
             * @param{Object} scope - $scope
             * @param{String} varName - variable name to bind object
             * @return{Promise<Object>}
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

            /**
             * @public
             * @param{Object} data - data object to persist to main array
             * @return{Promise<Object>} firebaseRef of newly added record
             */

            function basicAdd(data) {
                return qAll(mainArray(), data)
                    .then(add)
                    .catch(standardError);
            }



            /**
             * @public
             * @param{String|Object|Array} param - pass the key, the $firebaseObject, or [$firebaseArray,record]
             * @return{Promise<Object>} - promise resolves to the firebaseRef of the removed record
             */

            function removeMainRecord(param) {

                switch (angular.isString(param)) {
                    case true:
                        return mainRecord(param)
                            .then(remove);
                    default:
                        return remove(param);
                }

            }


            /************
             * GPS Option
             * ***********/

            /** 
             * @public
             * @param{Object} obj
             *
             * @param{Object|Array} obj.data locations to save
             * @param{String} [obj.path=self._points] child node for coordinates
             * @param{Object|String} [obj.id] if the main record already exists pass its firebaseRef or key and method will
             * add indexes
             * @param{String} [str] - key of main record to save as addRecordKey property
             * @return{Promise<Array>} promise resovles to an array of newly created location records or to location indexes
             */

            function sendToGeofireToAdd(obj, str) {
                if (!obj.path) {
                    obj.path = self._points;
                }
                switch (!obj.id) {
                    case true:
                        return self._geofireObject.add(obj.data, obj.path, str);
                    default:
                        return self._geofireObject.add(obj.data, obj.path, str)
                            .then(setReturnVal)
                            .then(addLocationIndices)
                            .catch(standardError);
                }

                function setReturnVal(res) {
                    var arr = []
                    arr.push(obj.id);
                    arr.push(res);
                    return arr;
                }
            }



            /**
             * @public
             * @param{Object} obj
             * @param{String} obj.id "mainRecordId"
             * @param{Boolean} [obj.flag=null] true if only wish to remove coordinates, otherwise leave undefined
             * @param{String} [obj.path=self._points] child node for coordinates
             * @param{Array<String>} [obj.locKeys] ["array","or","locationIds"] - optional
             * @return{Promise<Array>} [fireBaseRefs of removed main location records]
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


            /**
             * @public
             * @param{String} col - property name to query by
             * @param{String} id - key of record that you want to load locations of
             * @return{Promise<Array>}  - promise resolves to a $firebaseArray
             * @summary load all locations associates with a given main record
             *
             */
            function sendToGeoFireToLoadLocations(col, id) {
                return self._geofireObject.loadRecordLocations(col, id);
            }

            /**
             * @public
             * @param{String} key - record id
             * @param{Array} coords - [latitude,longitude]
             * @param{String} [pth=self._points] - name of child node to save coordinates at.
             * This defaults to name of the main node
             * @return{Promise<Object>} resolves to the firebaseRef of entire geofire node
             */

            function setCoords(key, coords, pth) {
                if (!pth) {
                    pth = self._points;
                }
                return self._geofireObject.set(key, coords, pth);
            }


            /**
             * @public
             * @param{String} key - id to lookup
             * @param{String} [pth=self._points] - name of child node to save coordinates at.
             * This defaults to name of the main node
             * @return{Promise<Array|Null>} resolves to the coordinates array or null if no record
             * is found
             */

            function getCoords(key, pth) {
                if (!pth) {
                    pth = self._points;
                }
                return self._geofireObject.get(key, pth);
            }

            /**
             * @public
             * @param{String} key - id to lookup
             * @param{String} [pth=self._points] - name of child node to save coordinates at.
             * This defaults to name of the main node
             * @return{Promise<Object>} resolves to the firebaseRef of entire geofire node
             *
             */

            function removeCoords(key, pth) {
                if (!pth) {
                    pth = self._points;
                }
                return self._geofireObject.remove(key, true, pth);
            }


            /**
             * @public
             * @param{Object} obj
             * @param{Number} obj.radius - radius of query
             * @param{Array<Number>} obj.center - [latitude,longitude]
             * @param{String} [pth=self._points] - name of child node to save coordinates at.
             * Defaults to name of main node
             * @return{Promise<Object>} geoquery object
             */


            function geoQuery(obj, pth) {
                if (!pth) {
                    pth = self._points;
                }
                return self._geofireObject.query(obj, pth);
            }

            /*****************
             * Geofire Option
             * ***************/

            /**
             * @public
             * @param{Object|Array<Object>} locs - either data object to add or [data,objects,to,add]
             * @param{String} path- name of child node for coordinates-- also used for setting fkey property
             * @param{String} [fkey] - key of associated main record
             * to name of main node
             * @return{Array} firebaseRefs of newly created main location Array records
             */

            function addLocations(locs, path, fkey) {
                var prop;
                if (!angular.isArray(locs)) {
                    locs = [locs];
                }

                if (angular.isString(fkey) && angular.isString(path)) {
                    prop = self._foreignKeys[path];
                }

                return self._q.all(locs.map(function(loc) {
                    if (angular.isString(prop)) {
                        loc[prop] = fkey;
                    }
                    return addFullLocationRecord(loc, path)
                        .catch(standardError);
                }));
            }

            /**
             * @public
             * @param{String|Array<String>} keys -either key - if only one record or ["keys","of","records"]
             * @param{Boolean} flag true if only wish to remove  coordinates, otherwise leave undefined
             * @return{Array} firebaseRefs of deleted record
             */

            function removeLocations(keys, flag, path) {
                if (!angular.isArray(keys)) {
                    keys = [keys];
                }

                return self._q.all(keys.map(function(key) {
                    return removeLocation(key, flag, path)
                        .catch(standardError);
                }));
            }

            /**
             * @public
             * @param{String} col - property name to query by
             * @param{String} id - key of record that you want to load locations of
             * @return{Promise<Array>}  - promise resolves to a $firebaseArray
             * @summary load all locations associates with a given main record
             */

            function loadRecordLocations(col, id) {
                return currentRecordLocations(col, id)
                    .then(wrapQuery)
                    .then(loaded)
                    .catch(standardError);
            }



            /**
             * @public
             * @param{String} key - id to lookup
             * @param{String} - name of child node to save coordinates at.
             * @return{Promise<Array|Null>} resolves to the coordinates array or null if no record
             * is found
             */

            function getGeofire(key, path) {
                return qAll(makeGeofire(path), key)
                    .then(getGeo)
                    .catch(standardError);
            }

            /**
             * @public
             * @param{Object} obj
             * @param{Number} obj.radius - radius of query
             * @param{Array<Number>} obj.center - [latitude,longitude]
             * @param{String} - name of child node to save coordinates at.
             * @return{Promise<Object>} geoquery object
             */

            function queryGeofire(data, path) {
                return qAll(makeGeofire(path), data)
                    .then(queryGeo)
                    .catch(standardError);
            }

            /**
             * @public
             * @param{String} key - id to lookup
             * @param{String} - name of child node to save coordinates at.
             * @return{Promise<Object>} resolves to the firebaseRef of entire geofire node
             *
             */

            function removeGeofire(key, path) {
                return qAll(makeGeofire(path), key)
                    .then(removeGeo)
                    .catch(standardError);
            }

            /**
             * @public
             * @param{String} key - record id
             * @param{Array} coords - [latitude,longitude]
             * @param{String} path of child node to save coordinates at.
             * @return{Promise<Object>} resolves to the firebaseRef of entire geofire node
             */

            function setGeofire(key, coords, path) {
                return qAll(makeGeofire(path), [key, coords])
                    .then(setGeo)
                    .catch(standardError);
            }

            /**
             * @public
             * @param{String} path - key in geofire services' foreignKey's object used to identify
             * this record's property name - see discussion in README
             * @param{String} locKey - id of location record to lookup
             * @param{String} mainRecId - id of main record to persist to the associated locations
             * @summary this method adds a "mainRec" property to any locations added - the actual
             * name of the property is determined in the constructor's foreignKeys option.  The value stored
             * is the main Record Id
             */

            function addRecordKey(path, locKey, mainRecId) {
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
                        obj[prop] = mainRecId;
                        return res.child(locKey).update(obj);
                    });
                }
            }


            /*************
             * User Option
             * ************/



            /**
             * @public
             * @return{Promise<Array>}  - promise resolves to a $firebaseArray
             * @summary load all main records associated with current User
             */

            function loadUserRecords() {
                return currentUserRecords()
                    .then(wrapQuery)
                    .then(loaded)
                    .catch(standardError);
            }

            /****************
             * Session Option
             * ***************/

            /**
             * @public
             * @param{Object} s - $scope object
             * @param{String} v - variable name to bind to
             * @summary - this is a helper method to bind the current record to the $scope object
             */

            function bindCurrent(s, v) {
                return bindTo(sessionId(), s, v);
            }

            /**
             * @public
             * @return{Promise<Object>} -promise resolves to a $firebaseObject of the current record
             */

            function current() {
                return mainRecord(sessionId());
            }

            /**
             * @public
             * @return{Object} - returns your app's session service
             */
            function session() {
                return self._sessionObject;
            }

            /**
             * @public
             * @return{String} - returns the current record id
             */

            function sessionId() {
                return self._sessionObject[self._sessionIdMethod]();
            }

            /*********************************/

            /*
             * Combo Methods */

            /** 
             * @public
             * @param{Object} data to save to user array - just saving key for now
             * @return{Array} [Promise(fireBaseRef at userIndex), firebaseRef(main record created)]
             * @summary save main record and to user index
             */

            function createWithUser(data) {
                return createMainRecord(data, self._uid)
                    .then(passKeyToUser)
                    .catch(standardError);

                function passKeyToUser(res) {
                    var prop;
                    if (self._customUserIndex) {
                        prop = data[self._userIndexProp];
                    }
                    return qAll(addUserIndex(res.key(), prop), res);
                }

            }


            /** 
             * @public
             * @param{String|Array}  key of main record to remove or [fireBaseArray,record to remove]
             * @return{Array<Promise>} [Promise(fireBaseRef at userIndex), firebaseRef(main record removed)]
             * @summary remove main record and user index
             */

            function removeWithUser(key) {
                return removeMainRecord(key)
                    .then(passKeyToUser)
                    .catch(standardError);

                function passKeyToUser(res) {
                    return qAll(removeUserIndex(res.key()), res);
                }

            }

            /**
             * @public
             * @param{Object} rec - data object to persist to main Array
             * @param{Object|Array<Object>} loc - location object associated with record or
             * [locations,associated,with,record]
             * @return{Promise<Object>} promise resolves to firebaseRef of newly created main record
             * @summary This method creates a main record and records of associated locations. It also
             * adds a location index to the main record and adds the main records key to the location
             * records.
             */

            function createWithGps(rec, loc) {
                var key;
                return createMainRecord(rec)
                    .then(function(res) {
                        if (self._addRecordKey) {
                            key = res.key();
                        }
                        return sendToGeofireToAdd({
                                data: loc
                            }, key)
                            .then(function(arr) {
                                return [res, arr];
                            })
                    })
                    .then(addLocationIndexAndPassKey)
                    .then(setReturnValueToSecond)
                    .catch(standardError);

                function addLocationIndexAndPassKey(res) {
                    return qAll(addLocationIndices(res), res[0]);
                }

            }


            /**
             * @public
             * @param{String} recId - id of main record
             * @return{Promise<Object>} promise resolves to firebaseRef of the removed main record
             * @summary This method removes a main record and any assocated locations
             */

            function removeWithGps(recId) {

                return qAll(sendToGeofireToRemove({
                        id: recId
                    }), recId)
                    .then(removeMainRec)
                    .catch(standardError);

                function removeMainRec(res) {
                    return removeMainRecord(res[1]);
                }
            }

            /** 
             * @public
             * @param{Object} rec to save to main array
             * @param{Object|Array} loc location data to persist- or [locations,to,persist]
             * @return{Promise<Object>} - Promise resolves to the firebaseRef of the newly created main record
             * @summary - This method adds a main record and records for any locations passed.  It also
             * adds a location index at the main record, adds main record Id to each location record, and
             * adds an index in the current user's firebase node.
             */

            function createWithUserAndGps(rec, loc) {
                var key;

                return createWithUser(rec)
                    .then(function(res) {
                        if (self._addRecordKey) {
                            key = res[1].key();
                        }
                        return sendToGeofireToAdd({
                                data: loc
                            }, key)
                            .then(function(arr) {
                                return [res, arr];
                            })
                    })
                    .then(addLocationIndexAndPassKey)
                    .then(setReturnValueToSecond)
                    .catch(standardError);

                function addLocationIndexAndPassKey(res) {
                    /*mainkey,geofire Obj*/
                    return self._q.all([addLocationIndices([res[0][1], res[1]]), res[0][1]]);
                }

            }

            /**
             * @public
             * @param{String} id key of location record to retrieve
             * @return{Promise<Object|Null>} - Promise resolves to the array record or null if not found
             */

            function getLocationRecord(id) {
                return self._geofireObject
                    .mainRecord(id)
            }

            /** 
             * @public
             * @param{String} mainRecId - key of main record to remove
             * @param{Promise<Object>} - Promise resolves to the firebaseRef of the removed main record
             *
             */

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

            /**
             * @public
             * @param{String} [item] property of 'self' object you wish to inspect
             * @return{Object|Array|String|etc} returns either the entire 'self' object or a specific property
             * @summary this method allows you to view your current configuration - pass a specific key to only retrieve
             * the given property, or pass no arguments to retrieve the entire object
             */
            function inspect(item) {
                switch (!item) {
                    case true:
                        return self;
                    case false:
                        item = "_" + item;
                        return self[item];
                }
            }

            /**************************************
             *  All Methods below are private
             * **********************************/

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

            /** 
             * @constructor
             * @summary adds methods for nested arrays specified via 'options.nestedArrays'
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

                newProp[saveRec] = function(rec, id) {
                    switch (angular.isArray(rec)) {
                        case true:
                            return save(rec)
                                .catch(standardError);
                        case false:
                            return qAll(newProp[arrName](id), rec)
                                .then(save)
                                .catch(standardError);
                    }

                };

                return newProp;
            }



            function add(res) {
                return res[0].$add(checkTimeStampAtCreate(res[1]));
            }

            function remove(res) {
                switch (angular.isArray(res)) {
                    case true:
                        return res[0].$remove(res[1])
                            .catch(standardError);
                    default:
                        return res.$remove()
                            .catch(standardError);
                }
            }

            function save(res) {
                switch (angular.isArray(res)) {
                    /* to save array record */
                    case true:
                        return saveArray(res)
                            .catch(standardError);
                        /* to save object */
                    case false:
                        res = checkTimeStampAtSave(res)
                        return res.$save()
                            .catch(standardError);
                }
            }

            function saveArray(params) {
                switch (angular.isNumber(params[1])) {
                    case true:
                        switch (self._timeStamp) {
                            case true:
                                return qAll(params[0], getRecord([params[0], keyAt(params)]))
                                    .then(updateTime);
                            default:
                                return params[0].$save(params[1]);
                        }
                        break;
                    default:
                        return updateTime(params);
                }

                function updateTime(res) {
                    return res[0].$save(checkTimeStampAtSave(res[1]));
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

            function removeLocation(key, flag, path) {
                switch (flag) {
                    case true:
                        return removeGeofire(key, path)
                    default:
                        return removeFullLocationRecord(key, path)
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

            function getRecord(res) {
                return res[0].$getRecord(res[1]);
            }

            function loadArrayAndGet(key) {
                return qAll(loadMainArray(), key)
                    .then(getRecord)
                    .catch(standardError);
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

            function addUserIndex(key, val) {
                return self._userObject
                    .addIndex(null, self._path, key, val);
            }

            function removeUserIndex(key) {
                return self._userObject
                    .removeIndex(null, self._path, key);
            }

            function keyAt(res) {
                return res[0].$keyAt(res[1]);
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

            /**
             * @private
             * @param{Array} arr
             * @param{Object|String} arr[0] firebaseRef or key of Record that has the associated location data
             * @param{Array} arr[1] array of firebaseRef of newly persisted locations
             * @return{Promise<Array>} array of location index, firebaseRef of location record
             * @summary creates indexes of persisted locations
             *
             */

            function addLocationIndices(arr) {
                if (!angular.isString(arr[0])) {
                    arr[0] = arr[0].key();
                }
                return self._q.all(arr[1].map(function(loc) {

                    return addIndex(arr[0], self._geofireIndex, loc.key());
                }));
            }

            function currentRecordLocations(prop, id) {
                return queryByChild(prop, id);
            }

            function currentUserRecords() {
                return queryByChild(self._uidProperty, sessionId());
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


            self._entity = entity;
            return self._entity;
        }
    };
}.call(this));
