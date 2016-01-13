(function() {
    "use strict";

    describe("FirePath factory", function() {
        var subject, $timeout, ref, testutils, test, options, userId, firePath, $rootScope, rootPath, $log;

        beforeEach(function() {
            rootPath = "https://your-firebase.firebaseio.com";
            angular.module("firebase.fuel")
                .config(function(fuelConfigurationProvider) {
                    fuelConfigurationProvider.setRoot(rootPath);
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
            inject(function(_utils_, _$timeout_, _testutils_, _firePath_, _$rootScope_, _$log_) {
                $timeout = _$timeout_;
                testutils = _testutils_;
                $rootScope = _$rootScope_;
                firePath = _firePath_;
                $log = _$log_;
            });
            ref = new MockFirebase(rootPath);
            options = {
                session: true,
                geofire: true,
                points: "points",
                sessionService: "session",
                sessionIdMethod: "getId",
                geofireName: "geofire"
            };
            spyOn($log, "info");
            subject = firePath("trips", options, rootPath);
        });
        afterEach(function() {
            subject = null;
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
                    nestedArrayRef: jasmine.any(Function)
                }));

            });
        });

        var paths = [
            [null, "mainArray", "trips"],
            [null, "mainRecord", "trips/1", "1"],
            ["ref", "geofireRef", "trips/hotels","hotels"],
            ["ref", "geofireRef", "trips/rooms","rooms"],
            ["ref", "mainRecordRef", "trips/1", "1"],
            ["ref", "nestedArrayRef", "trips/1/hotels", "1", "hotels"],
            ["ref", "nestedRecordRef", "trips/1/hotels/5", "1", "hotels","5"],
            [null,"indexAf", "trips/1/hotels", "1", "hotels","array"],
            [null,"nestedArray", "trips/1/hotels", "1", "hotels"],
            [null,"nestedRecord", "trips/1/hotels/5", "1", "hotels", "5"],
            [null,"nestedRecord", "trips/hotels/5", "hotels", "5"],
            [null,"makeGeofire", "trips/hotels","hotels"],
            [null,"makeGeofire", "trips/rooms","rooms"]
        ];


        function testPaths(y) {
            describe(y[1] + "()", function() {
                beforeEach(function() {
                    subject.setCurrentRef(ref.child("trips"));
                    $rootScope.$digest();
                    test = subject[y[1]](y[3], y[4], y[5]);
                    $rootScope.$digest();
                    $timeout.flush();
                });
                it("should be a promise", function() {
                    expect(test).toBeAPromise();
                });
                if (y[0] === null) {
                    it("should be an angularfire object/array", function() {
                        expect(getPromValue(test).$ref()).toBeAFirebaseRef();
                    });
                } else {
                    it("should be a firebaseRef", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                        // expect(test).toEqual("as");
                    });
                }
                it("should create the correct path", function() {
                    expect(subject.path()).toEqual(rootPath + "/" + y[2]);
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
    });


})();
