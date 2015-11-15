(function(angular) {
    'use strict';
    describe("app Module-Dependencies:", function() {
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
            it("should depend on fuelMod", function() {
                expect(hasModule("fuelMod")).toBeTruthy();
            });
            it("should depend on pathMod", function() {
                expect(hasModule("pathMod")).toBeTruthy();
            });
            it("should depend on utilsMod", function() {
                expect(hasModule("utilsMod")).toBeTruthy();
            });
        });
    });
    describe("providers", function() {
        var fuel, utils, firePath;
        beforeEach(function() {
            module("firebase.fuel");

            inject(function(_fuel_, _utils_, _firePath_) {
                utils = _utils_;
                firePath = _firePath_;
                fuel = _fuel_;
            });
        });

        it("should be defined", function() {
            expect(fuel).toBeDefined();
            expect(utils).toBeDefined();
            expect(firePath).toBeDefined();
        });
    });

})(angular);
