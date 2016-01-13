(function(angular) {
    'use strict';
    describe("firebase.fuel.config module", function() {
        describe("Module-Dependencies:", function() {
            var module;
            beforeEach(function() {
                module = angular.module("firebase.fuel.config");
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
                    deps = module.value('firebase.fuel.config').requires;
                });
                it("should depend on firebase.starter", function() {
                    expect(hasModule("firebase.starter")).toBeTruthy();
                });
            });
        });
    });

})(angular);
