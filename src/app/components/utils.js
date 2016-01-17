(function() {
    "use strict";


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
            return standardError("Invalid parameter type at: " + type);
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
