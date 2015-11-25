(function() {
    "use strict";


    angular.module("firebase.fuel.utils",['platanus.inflector'])
        .factory("utils", utilsFactory);


    /** @ngInject */
    function utilsFactory($log, $q, inflector) {

        var utils = {

            toArray: toArray,
            camelize: camelize,
            extendPath: extendPath,
            flatten: flatten,
            removeSlash: removeSlash,
            stringify: stringify,
            pluralize: pluralize,
            relativePath: relativePath,
            qWrap: qWrap,
            qAll: qAll,
            qAllResult: qAllResult,
            singularize: singularize,
						paramCheck: paramCheck,
						paramNodeIdx: removeMainPath,
            nodeIdx: setNodeIdx,
            nextPath: nextPath,
            standardError: standardError,

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
                case false:
                    return invalidType(str);
            }
        }

        function arrCheck(arr) {
            switch (Array.isArray(arr)) {
                case true:
                    return arr;

                case false:
                    return invalidType(arr);
            }
        }

        function setNestedArr(arr) {
            var n = [];

        }

        function boolCheck(bool) {
					var accepted = [false,true];

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
                        case "opt":
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
            if (path[path.length-1] === "/") {
                path = path.substring(0, path.length-1);
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
            if (Array.isArray(param)) {
                return flatten(param);
            } else {
                return extendPath([], param);
            }
        }

        function stringify(arr) {
            if (Array.isArray(arr)) {
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
						if(path[0]===""){
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
    }



})();
