(function() {
    "use strict";

    angular.module('firebase.fuel.config', ['firebase.starter'])

    .provider('fuelConfiguration', FuelConfigProvider);

    function FuelConfigProvider(fireStarterProvider) {
        var prov = this;
        prov.setRoot = function(val) {
            fireStarterProvider.setRoot(val);
        }
        prov.getRoot = function() {
            return fireStarterProvider.getRoot();
        }

        prov.$get = ["fireStarter",
            function(fireStarter) {
                switch (angular.isString(prov.getRoot())) {
                    case true:
                        return function(type, path, options) {
                            return fireStarter(type, path, options)
                        };
                    case false:
                        throw new Error("You must define a root url in your module's config block");
                }
            }
        ];
    }


})();
