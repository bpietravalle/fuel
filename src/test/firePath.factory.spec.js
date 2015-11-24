(function() {
    "use strict";
    describe("Inject", function() {
        var testFactory, rootPath;
        describe("with invalid Config", function() {
            beforeEach(function() {
                rootPath = "https://your-firebase.firebaseio.com";
                angular.module("test", ["firebase.fuel"])
                    .factory("testFactory", ["fuel",
                        function(fuel) {
                            return fuel("main");
                        }
                    ]);
            });
            it("should throw Error", function() {
                expect(function() {
                    module("test");
                    inject(function(_testFactory_) {
                        testFactory = _testFactory_;
                    });
                    testFactory
                }).toThrow();
            });
        });
        describe("with valid Config", function() {
            var fuel;
            beforeEach(function() {
                rootPath = "https://your-firebase.firebaseio.com";
                angular.module("test", ["firebase.fuel"])
                    .config(function(fuelProvider) {
                        fuelProvider.setRoot(rootPath);
                    })
                    .factory("testFactory", ["fuel",
                        function(fuel) {
                            return fuel("main");
                        }
                    ]);
                module("test");
                inject(function(_testFactory_, _fuel_) {
                    fuel = _fuel_;
                    testFactory = _testFactory_;
                });
            });
            it("should be defined", function() {
                expect(fuel).toEqual(jasmine.any(Function));
                expect(fuel).toBeDefined();
                expect(testFactory).toBeDefined();
            });
            it("should have a root path defined in fuel object", function() {
                expect(testFactory.inspect()._rootPath).toEqual(rootPath);
            });
            it("should have a root path defined in firePath object", function() {
                expect(testFactory.inspect()._pathMaster.inspect()._rootPath).toEqual(rootPath);
            });

            it("should have a rootPath equal to value set in config phase", function() {
                expect(testFactory.inspect()._pathMaster.root().toString()).toEqual(rootPath + "/");
            });
            it("should have a current ref = main()", function() {
                expect(testFactory.ref().key()).toEqual("main");
            });
        });
    });

    describe("FirePath factory", function() {
        var path, subject, $window, fuel, ref, utils, testutils, fuel, session, test, options, userId, spy, options, firePath, $rootScope, rootPath, $q, $log, $injector;

        beforeEach(function() {
            rootPath = "https://your-firebase.firebaseio.com";
            angular.module("firebase.fuel")
                .config(function(fuelProvider) {
                    fuelProvider.setRoot(rootPath);
                })
                .factory("session", function() {
                    return {
                        getId: jasmine.createSpy("getId").and.callFake(function() {
                            userId = 1;
                            return userId;
                        })
                    }
                });
            module("testutils");
            module("firebase.fuel");
            MockFirebase.override();
            inject(function(_$window_, _utils_, _testutils_, _firePath_, _$rootScope_, _$q_, _$log_, _$injector_) {
                testutils = _testutils_;
                utils = _utils_;
                $window = _$window_;
                $rootScope = _$rootScope_;
                $injector = _$injector_;
                firePath = _firePath_;
                $q = _$q_;
                $log = _$log_;
            });
            ref = new MockFirebase(rootPath);
            options = {
                session: true,
                geofire: true,
                sessionService: "session",
                sessionIdMethod: "getId",
                geofireName: "geofire"
            };
            spyOn($log, "info");
            subject = firePath("trips", options, rootPath);
        });
        afterEach(function() {
            subject = null;
            spy = null;
            $rootScope = null;
            firePath = null;
        });
        describe("Constructor", function() {
            it("should work", function() {
                expect(subject).toBeDefined();
                expect(subject.ref()).toBeDefined();
            });
            it("should have correct methods", function() {
                expect(subject).toEqual(jasmine.objectContaining({
                    mainArray: jasmine.any(Function),
                    mainRecord: jasmine.any(Function),
                    nestedArray: jasmine.any(Function),
                    nestedRecord: jasmine.any(Function),
                    nestedRef: jasmine.any(Function)
                }));

            });
        });

        var paths = [
            ["mainArray", "trips"],
            ["mainRecord", "trips/1", "1"],
            ["nestedRef", "trips/1", "1"],
            ["nestedArray", "trips/hotels", "hotels", undefined],
            ["nestedArray", "trips/1/hotels", "1", "hotels"],
            ["nestedRecord", "trips/1/hotels/5", "1", "hotels", "5"],
            ["nestedRecord", "trips/hotels/5", "hotels", "5"],
            ["makeGeo", "trips/hotels", ["hotels"]],
        ];

        function testPaths(y) {
            describe(y[0] + "()", function() {
                beforeEach(function() {
                    subject.setCurrentRef(ref.child("trips"));
                    $rootScope.$digest();
                    test = subject[y[0]](y[2], y[3], y[4]);
                    $rootScope.$digest();
                });
                if (y[0] === "nestedRef") {
                    it("should be a firebaseRef", function() {
                        expect(test).toBeAFirebaseRef();
                    });
                } else {

                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should be an angularfire object/array", function() {
                        expect(getPromValue(test).$ref()).toBeAFirebaseRef();
                    });
                }

                it("should create the correct path", function() {
                    expect(subject.path()).toEqual(rootPath + "/" + y[1]);
                });
            });
        }

        paths.forEach(testPaths);

        describe("ref", function() {
            it("shouold be defined", function() {
                expect(subject.ref()).toBeDefined();
            });
        });

        describe("root", function() {
            it("is a firebaseRef", function() {
                expect(subject.root()).toBeAFirebaseRef();
            });
            it("should create the correct path", function() {
                expect(subject.root().path).toEqual(rootPath);
            });
        });

        describe("setCurrentRef", function() {
            beforeEach(function() {
                ref = new MockFirebase("data").child("child");
            });
            describe("When 2nd arg is undefined", function() {
                it("should set ref if passed a firebaseRef", function() {
                    subject.setCurrentRef(ref);
                    $rootScope.$digest();
                    expect(subject.ref()).toEqual(ref);
                });
                it("should not set the base() to null", function() {
                    expect(subject.base()).not.toEqual(null);
                    subject.setCurrentRef(ref);
                    $rootScope.$digest();
                    expect(subject.base()).not.toEqual(null);
                });
            });

            describe("When 2nd arg === true", function() {
                beforeEach(function() {
                    subject.mainArray();
                    flush();
                });
                it("should set the base() to null", function() {
                    expect(subject.base()).not.toEqual(null);
                    subject.setCurrentRef(ref, true);
                    $rootScope.$digest();
                    expect(subject.base()).toEqual(null);
                });

            });
        });
        describe("build", function() {


            var params = [

                [
                    "trips/1", ["trips"], "trips"
                ],
                [
                    "trips/1", ["trips", "1", "hotels", "5", "rooms"], "trips/1/hotels/5/rooms"
                ],
                [
                    "trips/1", ["trips", "1"], "trips/1"
                ],
                [
                    "trips/1/hotels", ["trips", "1"], "trips/1"
                ],
                [
                    "trips/1/rooms/53/floor", ["trips", "1", "rooms"], "trips/1/rooms"
                ],
                [
                    "trips/1/rooms/53/floor", ["trips"], "trips"
                ],
            ];

            function checkPathTests(y) {
                describe("when path is: " + y[0], function() {
                    beforeEach(function() {
                        ref = ref.child(y[0]);
                        subject.setCurrentRef(ref);
                        $rootScope.$digest();
                    });
                    it("should have a defined ref() beforehand", function() {
                        expect(subject.ref()).toBeDefined();
                        expect(subject.path()).toEqual(rootPath + "/" + y[0]);
                    });

                    it("should set path to: " + y[2], function() {
                        subject.build(y[1], "object");
                        $rootScope.$digest();
                        subject.ref().flush();
                        $rootScope.$digest();
                        expect(subject.path()).toEqual(rootPath + "/" + y[2]);
                    });

                });
            }
            params.forEach(checkPathTests);
        });
        describe("Invalid options", function() {
            describe("session", function() {
                it("should throw error if no sessionService is present", function() {
                    expect(function() {
                        options = {
                            session: true,
                            sessionIdMethod: "getId"
                        };
                        firePath("trips", options);

                    }).toThrow(), "object";
                });
                it("should throw error if no sessionIdMethod is present", function() {
                    expect(function() {
                        options = {
                            session: true,
                            sessionService: "session"
                        };
                        firePath("trips", options);

                    }).toThrow();
                });


            });

        });

        function getPromValue(obj, flag) {
            return testutils.getPromValue(obj, flag);
        }

        function flush() {
            $rootScope.$digest();
            subject.ref();
            $rootScope.$digest();
        }

        function logCheck(x, flag) {
            if (flag === true) {
                return expect($log.info.calls.allArgs()).toEqual(x);
            } else {
                it("should log:" + x, function() {
                    expect($log.info.calls.allArgs()).toEqual(x);
                });
            }
        }

        function logContains(message, flag) {
            return testutils.logContains(message, flag);
        }
    });


})();
