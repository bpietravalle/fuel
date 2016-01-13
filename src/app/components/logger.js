(function() {
    "use strict";

    /** @ngInject */
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
