(function() {
    "use strict";

    /** @ngInject */
    function loggerFactory($log) {

        return {

            info: info,



        }

        function info(data) {
            $log.info(data);
        }


    }

    angular.module("firebase-fuel")
        .factory("logger", loggerFactory);
})();
