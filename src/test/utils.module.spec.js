(function(angular) {
    'use strict';
    describe("firebase.utils module", function() {
        describe("Module-Dependencies:", function() {
            var module;
            beforeEach(function() {
                module = angular.module("firebase.fuel.utils");
            });

            it("should exist", function() {
                expect(module).toBeDefined();
            });
            // describe("Dependencies:", function() {
            //     var deps;
            //     var hasModule = function(m) {
            //         return deps.indexOf(m) >= 0;
            //     };
            //     beforeEach(function() {
            //         deps = module.value('firebase.fuel.utils').requires;
            //     });
            //     it("should depend on platanus.inflector", function() {
            //         expect(hasModule("platanus.inflector")).toBeTruthy();
            //     });
            // });
        });
    });

})(angular);
