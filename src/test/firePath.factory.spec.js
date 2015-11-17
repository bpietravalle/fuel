(function() {
    "use strict";

    describe("FirePath factory", function() {
        var path, subject, $window, fuel, ref, utils, testutils, fuel, session, test, options, userId, spy, options, firePath, $rootScope, rootPath, $q, $log, $injector;

        beforeEach(function() {
            angular.module("firebase.fuel")
                .constant("FBURL", "https://your-firebase.firebaseio.com/")
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
            rootPath = "https://your-firebase.firebaseio.com";
            ref = new MockFirebase(rootPath);
            options = {
                sessionAccess: true,
                geofire: true,
                sessionLocation: "session",
                sessionIdMethod: "getId",
                geofireName: "geofire"
            };
            spyOn($log, "info");
            subject = firePath("trips", options);
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

                it("should be a promise", function() {
                    expect(test).toBeAPromise();
                });
                it("should be an angularfire object/array", function() {
                    expect(getPromValue(test).$ref()).toBeAFirebaseRef();
                });

                it("should create the correct path", function() {
                    expect(subject.path()).toEqual(rootPath + "/"+ y[1]);
                });
            });
        }

        paths.forEach(testPaths);

        describe("ref", function() {
            it("shouold be defined", function() {
                expect(subject.ref()).toBeDefined();
            });
        });

        describe("rootRef", function() {
            it("is a firebaseRef", function() {
                expect(subject.rootRef()).toBeAFirebaseRef();
            });
            it("should create the correct path", function() {
                expect(subject.rootRef().path).toEqual(rootPath + "/");
            });
        });

        describe("setCurrentRef", function() {
            beforeEach(function() {
                ref = new MockFirebase("data").child("child");
            });
            it("should set ref if passed a firebaseRef", function() {
                subject.setCurrentRef(ref);
                $rootScope.$digest();
                $rootScope.$digest();
                expect(subject.ref()).toEqual(ref);
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
                it("should throw error if no sessionLocation is present", function() {
                    expect(function() {
                        options = {
                            sessionAccess: true,
                            sessionIdMethod: "getId"
                        };
                        firePath("trips", options);

                    }).toThrow(), "object";
                });
                it("should throw error if no sessionIdMethod is present", function() {
                    expect(function() {
                        options = {
                            sessionAccess: true,
                            sessionLocation: "session"
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
