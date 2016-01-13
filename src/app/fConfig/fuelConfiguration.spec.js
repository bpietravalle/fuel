(function() {
    "use strict";

    describe("fuelConfiguration provider", function() {
        var subject, options, fuelConfiguration, rootPath;

        beforeEach(function() {
            rootPath = "https://your-firebase.firebaseio.com";
        });
        afterEach(function() {
            subject = null;
            fuelConfiguration = null;
        });

        describe("With no rootRef set", function() {
            it("should throw an error", function() {
                expect(function() {
                    module("firebase.fuel.config");
                    inject(function(_fuelConfiguration_) {
                        fuelConfiguration = _fuelConfiguration_;
                    });
                }).toThrow();
            });
        });

        describe("Valid Config",function() {
            beforeEach(function() {
                angular.module("firebase.fuel.config")
                    .config(function(fuelConfigurationProvider) {
                        fuelConfigurationProvider.setRoot(rootPath);
                    })
                module("firebase.fuel.config");
                inject(function(_fuelConfiguration_) {
                    fuelConfiguration = _fuelConfiguration_;
                });
                subject = fuelConfiguration("geo", ["path"], options);
            });
						it("should be defined",function(){
							expect(subject).toBeDefined();
						});
						it("should return a fireStarter obj",function(){
							expect(subject.inspect()).toBeDefined();
						});
						it("should have a rootPath = to prov.rootRef",function(){
							expect(subject.inspect()._rootPath).toEqual(rootPath);
						});
        });

    });


})();
