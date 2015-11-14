(function() {
    "use strict";

    describe("FirePath factory", function() {
        var path, subject, $window, fuel, ref, utils, testutils, fuel, session, test, options, userId, spy, options, firePath, $rootScope, rootPath, $q, $log, $injector;

        beforeEach(function() {
            angular.module("firebase-fuel")
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
            module("firebase-fuel");
            MockFirebase.override();
            inject(function(_fuel_, _$window_, _utils_, _testutils_, _firePath_, _$rootScope_, _$q_, _$log_, _$injector_) {
                testutils = _testutils_;
                utils = _utils_;
                $window = _$window_;
                fuel = _fuel_;
                $rootScope = _$rootScope_;
                $injector = _$injector_;
                firePath = _firePath_;
                $q = _$q_;
                $log = _$log_;
            });
            rootPath = "https://your-firebase.firebaseio.com/";
            ref = new MockFirebase(rootPath);
            options = {
                sessionAccess: true,
                geofire: true,
                sessionLocation: "session",
                sessionIdMethod: "getId",
                locationName: "locations",
                geofireName: "geofire"
            };
            spyOn($log, "info");
            subject = firePath("trips", options);
            // fuel = fuel("trips");
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
            ["mainRef", "trips"],
            ["mainArray", "trips"],
            ["mainRecord", "trips/1", "1"],
            ["nestedArray", "trips/hotels", "hotels"],
            ["nestedArray", "trips/1/hotels", "1", "hotels"],
            ["nestedRecord", "trips/1/hotels/5", "1", "hotels", "5"],
            ["nestedRecord", "trips/hotels/5", "hotels", "5"],
            ["makeGeo", "trips/hotels",["hotels"]],
        ];

        function testPaths(y) {
            describe(y[0] + "()", function() {
                beforeEach(function() {
                    subject.setCurrentRef(ref);
                    $rootScope.$digest();
                    test = subject[y[0]](y[2], y[3], y[4]);
                    $rootScope.$digest();
                });

                it("should be a promise", function() {
                    expect(test).toBeAPromise();
                });
                if (y[0] !== "userIndex" && y[0] !== "locationsIndex" && y[0] !== "mainRef") {
                    it("should be an angularfire object/array", function() {
                        expect(getPromValue(test).$ref()).toBeAFirebaseRef();
                    });
                } else {
                    it("should be a firebaseRef", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                    });
                }

                it("should create the correct path", function() {
                    expect(subject.currentPath()).toEqual(rootPath + y[1]);
                });
            });
        }

        paths.forEach(testPaths);

        describe("currentRef", function() {
            it("shouoldn't be defined", function() {
                expect(subject.currentRef()).not.toBeDefined();
            });
        });

        describe("rootRef", function() {
            it("is a firebaseRef", function() {
                expect(subject.rootRef()).toBeAFirebaseRef();
            });
            it("should create the correct path", function() {
                expect(subject.rootRef().path).toEqual(rootPath);
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
                expect(subject.currentRef()).toEqual(ref);
            });

        });
        describe("checkPathParams", function() {


            var params = [
                // current, args, expected path, log call
                [
                    null, ["trips", "1"], "trips/1", "setting new firebase node"
                ],

                [
                    "trips/1", ["trips"], "trips", "Using currentParentRef"
                ],
                [
                    "trips/1", ["trips", "1", "hotels", "5", "rooms"], "trips/1/hotels/5/rooms", "Building childRef"
                ],
                [
                    "trips/1", ["geofire", "trips", "1"], "geofire/trips/1", "Setting new firebase node"
                ],
                [
                    "trips/1", ["trips", "1"], "trips/1", "Reusing currentRef"
                ],
            ];

            function checkPathTests(y) {
                describe("when currentPath is: " + y[0], function() {
                    beforeEach(function() {
                        if (angular.isString(y[0])) {
                            ref = ref.child(y[0]);
                            subject.setCurrentRef(ref);
                            $rootScope.$digest();
                        }
                    });
                    if (y[0] === null) {
                        it("should have undefined currentRef beforehand", function() {
                            expect(subject.currentRef()).not.toBeDefined();
                        });
                    } else {
                        it("should have a defined currentRef() beforehand", function() {
                            expect(subject.currentRef()).toBeDefined();
                            expect(subject.currentPath()).toEqual(rootPath + y[0]);
                        });

                    }

                    it("should set currentPath to: " + y[2], function() {
                        subject.checkPathParams(y[1]);
                        $rootScope.$digest();
                        expect(subject.currentPath()).toEqual(rootPath + y[2]);
                    });

                    it("call $log info with: " + y[3], function() {
                        subject.checkPathParams(y[1]);
                        $rootScope.$digest();
                        logContains(y[3], true);
                    });
                });
            }
            params.forEach(checkPathTests);
            describe("if passed a firebaseRef rather than path", function() {
                beforeEach(function() {
                    ref = ref.child("phones");
                    subject.checkPathParams(ref, "ARRAY", true);
                    $rootScope.$digest();
                });
                it("should work", function() {
                    expect(subject.currentPath()).toEqual(rootPath + "phones");

                });


            });
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

        var currentPaths = [
            ["currentRecord", "100"],
            ["currentParentNode", "rooms"],
            ["currentNode", "1000"],
            ["currentNestedArray", "hotels"],
            ["currentNestedRecord", "5"],
            ["currentDepth", 6],
            ["currentNodeIdx", 4, "rooms"],
        ];

        function testCurrentPath(y) {
            describe(y[0], function() {
                beforeEach(function() {
                    this.relativePath = "trips/100/hotels/5/rooms/1000";
                    this.fullPath = rootPath + this.relativePath;
                    ref = ref.child(this.relativePath);
                    subject.setCurrentRef(ref);
                    $rootScope.$digest();
                });

                it("should return correct value", function() {
                    expect(subject[y[0]](y[2])).toEqual(y[1]);
                });



            });
        }
        currentPaths.forEach(testCurrentPath);

        function logCheck(x, flag) {
            return testutils.logCheck(x, flag);
        }

        function getPromValue(obj, flag) {
            return testutils.getPromValue(obj, flag);
        }

        function flush() {
            $rootScope.$digest();
            subject.currentRef();
            $rootScope.$digest();
        }

        function logContains(message, flag) {
            return testutils.logContains(message, flag);
        }
    });


})();
