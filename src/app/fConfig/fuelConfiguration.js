(function() {
    "use strict";

    angular.module('firebase.fuel.config')

    .provider('fuelConfiguration', FuelConfigProvider);

    /**
     * @public
     * @constructor
     * @see {@link https://github.com/bpietravalle/fireStarter}
     */

    /** @ngInject */
    function FuelConfigProvider(fireStarterProvider) {
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
