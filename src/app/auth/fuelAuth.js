(function() {
    "use strict";

    /** @ngInject */
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
