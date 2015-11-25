(function(angular) {
    'use strict';
    describe("firebase.fuel.services module", function() {
        describe("Module-Dependencies:", function() {
            var module;
            beforeEach(function() {
                module = angular.module("firebase.fuel.services");
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
                    deps = module.value('firebase.fuel.services').requires;
                });
                it("should depend on firebase.fuel.utils", function() {
                    expect(hasModule("firebase.fuel.utils")).toBeTruthy();
                });
                it("should depend on firebase.fuel.logger", function() {
                    expect(hasModule("firebase.fuel.logger")).toBeTruthy();
                });
                it("should depend on firebase.fuel.config", function() {
                    expect(hasModule("firebase.fuel.config")).toBeTruthy();
                });
            });
        });
    });

})(angular);
