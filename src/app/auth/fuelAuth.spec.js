(function() {
    "use strict";

    describe("fuelAuth", function() {
        var fuelAuth, rootPath;

        beforeEach(function() {
            rootPath = "https://your-firebase.firebaseio.com";
            angular.module('firebase.fuel')
                .config(function(fuelConfigurationProvider) {
                    fuelConfigurationProvider.setRoot(rootPath);
                });
            module('firebase.fuel');
            inject(function(_fuelAuth_) {
                fuelAuth = _fuelAuth_;
            });
        });
        it("should be defined", function() {
            expect(fuelAuth).toBeDefined();
        });
        describe("Returns a $firebaseAuth", function() {
            var methods = ["$authWithCustomToken","$authAnonymously","$authWithOAuthToken","$waitForAuth","$unauth", "$getAuth",
                "$authWithPassword", "$authWithOAuthPopup", "$changePassword", "$changeEmail", "$createUser", "$removeUser", "$requireAuth", "$resetPassword"
            ];

            function testDefined(y) {
                it(y + " should be defined", function() {
                    expect(fuelAuth[y]).toBeDefined();
                });
                it(y + " should be a function", function() {
                    expect(fuelAuth[y]).toEqual(jasmine.any(Function));
                });
            }
            methods.forEach(testDefined);


        });

    });
})();
