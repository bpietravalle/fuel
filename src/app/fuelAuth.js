(function() {
    "use strict";

    /** @ngInject */

    function authObjFactory(fuelConfiguration) {
        return fuelConfiguration("auth");
    }

    angular.module("firebase.fuel.services")
        .factory("fuelAuth", authObjFactory);
})();
