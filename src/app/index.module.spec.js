(function(angular) {
    'use strict';
    describe("firebase.fuel module", function() {
        describe("Module-Dependencies:", function() {
            var module;
            beforeEach(function() {
                module = angular.module("firebase.fuel");
            });

            it("should exist", function() {
                expect(module).toBeDefined();
            });
            describe("Dependencies:", function() {
                var deps;
                var hasModule = function(m) {
                    return deps.indexOf(m) >= 0;
                };
                beforeEach(function() {
                    deps = module.value('firebase.fuel').requires;
                });
                it("should depend on firebase.fuel.services", function() {
                    expect(hasModule("firebase.fuel.services")).toBeTruthy();
                });
                it("should depend on firebase.fuel.config", function() {
                    expect(hasModule("firebase.fuel.config")).toBeTruthy();
                });
            });
        });
    });

})(angular);
