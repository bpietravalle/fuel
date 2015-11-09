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

    angular.module("fireStarter.services")
        .factory("logger", loggerFactory);
})();
