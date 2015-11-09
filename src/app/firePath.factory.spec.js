(function() {
    "use strict";

    describe("FirePath factory", function() {
        var path, $window, fuel, ref, utils, fireEntity, session, test, options, userId, spy, options, firePath, $rootScope, rootPath, $q, $log, $injector;

        beforeEach(function() {
            angular.module("fireStarter.services")
                .factory("session", function() {
                    return {
                        getId: jasmine.createSpy("getId").and.callFake(function() {
                            userId = 1;
                            return userId;
                        })
                    }
                });
            module("fireStarter.services");
            inject(function(_fireEntity_, _$window_, _utils_, _firePath_, _$rootScope_, _$q_, _$log_, _$injector_) {
                utils = _utils_;
                $window = _$window_;
                fireEntity = _fireEntity_;
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
            path = firePath("trips", options);
            // fuel = fireEntity("trips");
        });
        afterEach(function() {
            path = null;
            spy = null;
            $rootScope = null;
            firePath = null;
        });
        describe("Constructor", function() {
            it("should work", function() {
                expect(path).toBeDefined();
            });
            it("should have correct methods", function() {
                expect(path).toEqual(jasmine.objectContaining({
                    mainArray: jasmine.any(Function),
                    mainRecord: jasmine.any(Function),
                    nestedArray: jasmine.any(Function),
                    nestedRecord: jasmine.any(Function),
                    makeNestedRef: jasmine.any(Function)
                }));

            });
        });

        var paths = [
            ["mainArray", "trips"],
            ["mainRecord", "trips/1", "1"],
            ["nestedArray", "trips/1/hotels", "1", "hotels"],
            ["nestedRecord", "trips/1/hotels/5", "1", "hotels", "5"],
            ["makeNestedRef", "trips/1/hotels/5/rooms/100", "1/hotels/5/rooms", "100"],
            ["makeNestedRef", "trips/1/hotels/5/rooms/100", [1, 'hotels', 5, 'rooms'], "100"],
            // ["userNestedArray", "users/1/trips"],
            // ["userNestedRecord", "users/1/trips/5", "5"],
            ["geofireArray", "geofire/trips"],
            ["geofireRecord", "geofire/trips/5", "5"],
            // ["mainLocationsArray", "locations/trips"],
            // ["mainLocationsRecord", "locations/trips/5", "5"]
        ];

        function testPaths(y) {
            describe(y[0] + "()", function() {
                beforeEach(function() {
                    path.setCurrentRef(ref);
                    $rootScope.$digest();
                    test = path[y[0]](y[2], y[3], y[4]);
                    $rootScope.$digest();
                });

                it("should be a promise", function() {
                    expect(test).toBeAPromise();
                });
                it("should be an angularfire object/array", function() {
                    expect(getPromValue(test).ref()).toBeAFirebaseRef();
                });

                it("should create the correct path", function() {
                    expect(path.currentPath()).toEqual(rootPath + y[1]);
                });
            });
        }

        paths.forEach(testPaths);

				describe("currentRef",function(){
					it("shouoldn't be defined",function(){
						expect(path.currentRef()).not.toBeDefined();

					});

				});

        describe("rootRef", function() {
            it("is a firebaseRef", function() {
                expect(path.rootRef()).toBeAFirebaseRef();
            });
            it("should create the correct path", function() {
                expect(path.rootRef().path).toEqual(rootPath);
            });
        });

        describe("setCurrentRef", function() {
            beforeEach(function() {
                ref = new MockFirebase("data").child("child");
            });
            it("should set ref if passed a firebaseRef", function() {
                path.setCurrentRef(ref);
                $rootScope.$digest();
                $rootScope.$digest();
                // expect(path.gsetCurrentPath).toHaveBeenCalledWith("data/child");
                expect(path.currentRef()).toEqual(ref);
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
                            path.setCurrentRef(ref);
                            $rootScope.$digest();
                        }
                    });
                    if (y[0] === null) {
                        it("should have undefined currentRef beforehand", function() {
                            expect(path.currentRef()).not.toBeDefined();
                        });
                    } else {
                        it("should have a defined currentRef() beforehand", function() {
                            expect(path.currentRef()).toBeDefined();
                            expect(path.currentPath()).toEqual(rootPath + y[0]);
                        });

                    }

                    it("should set currentPath to: " + y[2], function() {
                        path.checkPathParams(y[1]);
                        $rootScope.$digest();
                        expect(path.currentPath()).toEqual(rootPath + y[2]);
                    });

                    it("call $log info with: " + y[3], function() {
                        path.checkPathParams(y[1]);
                        $rootScope.$digest();
                        // logCheck(null,true);
                        logContains(y[3], true);
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

                    }).toThrow(),"object";
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
                    path.setCurrentRef(ref);
                    $rootScope.$digest();
                });

                it("should return correct value", function() {
                    expect(path[y[0]](y[2])).toEqual(y[1]);
                });



            });
        }
        currentPaths.forEach(testCurrentPath);

        function logCheck(x, flag) {
            if (flag === true) {
                return expect($log.info.calls.allArgs()).toEqual(x);
            } else {
                it("should log:" + x, function() {
                    expect($log.info.calls.allArgs()).toEqual(x);
                });
            }
        }

        function getPromValue(obj, flag) {
            if (flag === true) {
                return obj.$$state.value['data'];
            } else {
                return obj.$$state.value;
            }
        }
        function logContains(message, flag) {
            var logArray = $log.info.calls.allArgs();
            var flatLog = logArray.reduce(function(x, y) {
                return x.concat(y);
            }, []);
            if (flag === true) {
                return expect(flatLog.indexOf(message)).toBeGreaterThan(-1);
            } else {
                it("should call $log.info with " + message, function() {
                    expect(flatLog.indexOf(message)).toBeGreaterThan(-1);
                });
            }
        }
    });


})();
