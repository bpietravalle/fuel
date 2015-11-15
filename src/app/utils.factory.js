(function() {
    "use strict";


    angular.module("utilsMod",["platanus.inflector"])
        .factory("utils", utilsFactory);


    /** @ngInject */
    function utilsFactory($log, $q, inflector) {

        var utils = {

            arrayify: arrayify,
            camelize: camelize,
            extendPath: extendPath,
            flatten: flatten,
            removeSlash: removeSlash,
            stringify: stringify,
            pluralize: pluralize,
            qWrap: qWrap,
            qAll: qAll,
            qAllResult: qAllResult,
            singularize: singularize,
            standardError: standardError,

        };

        return utils;

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

        function removeSlash(path) {
            if (path[-1] === "/") {
                path = path.substring(0, -1);
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

        function arrayify(param) {
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

        function extendPath(arr, id) {
            arr.push(id);
            //should be able to get rid of flatten
            return flatten(arr);
        }

    }



})();
