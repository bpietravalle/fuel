(function() {
    "use strict";

    describe("Fuel Factory", function() {
        var keyMock, rootPath, test, $rootScope, fuel, subject, $q, $log;

        beforeEach(function() {
            rootPath = "https://your-firebase.firebaseio.com";
            keyMock = function(id, q) {
                return jasmine.createSpy(id).and.callFake(function() {
                    var mock = {
                        key: function() {
                            return id + "Key";
                        }
                    }
                    return q.when(mock);
                });
            };

            module("testutils");
            module("firebase.fuel", function($provide) {
                $provide.factory("geofire", function($q) {
                    var geofire = {
                        set: keyMock("set", $q),
                        remove: keyMock("remove", $q),
                        get: keyMock("get", $q)

                    };

                    return geofire;

                });
                $provide.factory("user", function($q) {
                    var user = {
                        addIndex: keyMock("addIndex", $q),
                        removeIndex: keyMock("removeIndex", $q),
                        getIndexKeys: function() {
                            return "spy";
                        }
                    };

                    return user;
                });
                $provide.factory("session", function() {
                    return {
                        getId: function() {}
                    }
                });
                $provide.factory("firePath", function($q) {
                    var mock = new MockFirebase(rootPath);
                    return jasmine.createSpy("firePath").and.callFake(function(p) {
                        return {
                            ref: ref,
                            buildFire: jasmine.createSpy("buildFire").and.callFake(function() {
                                var obj = jasmine.createSpyObj("fire", ["$loaded"]);
                                return $q.when(obj);
                            }),

                            main: jasmine.createSpy("main").and.callFake(function() {
                                return ref();
                            })
                        }

                        function ref() {
                            return extend(mock.child(p))
                        }
                    });
                });
            });

            inject(function(_$log_, _$rootScope_, _fuel_, _$q_) {
                $rootScope = _$rootScope_;
                fuel = _fuel_;
                $q = _$q_;
                $log = _$log_;
            });

            spyOn($q, "reject").and.callThrough();
            spyOn($log, "info").and.callThrough();
        });
        afterEach(function() {
            subject = null;
            fuel = null;
        });

        describe("loadRecordLocations", function() {
            beforeEach(function() {
                subject = fuel("trips", {
                    geofire: true
                });
                test = subject.loadRecordLocations("tripId", "uniqueKey");
                $rootScope.$digest();
            });
            it("should be a promise", function() {
                expect(test).toBeAPromise();
            });
            it("should call firePath.main()", function() {
                // expect(firePath.main).toHaveBeenCalled();
            });
        });
        describe("loadUserRecords", function() {
            beforeEach(function() {
                subject = fuel("trips", {
                    user: true
                });
                test = subject.loadUserRecords();
                $rootScope.$digest();
            });
            it("should be a promise", function() {
                expect(test).toBeAPromise();
            });
            // it("should call firePath.main()", function() {
            //     expect(firePath.main).toHaveBeenCalled();
            // });
        });

        function extend(obj) {
            var extension = {
                orderByChild: jasmine.createSpy("orderByChild").and.callFake(function() {
                    return {
                        startAt: function() {
                            return {
                                endAt: function() {
                                    return {
                                        on: function() {}
                                    }

                                }
                            }
                        },
                        equalTo: function() {}
                    }
                })
            };
            return _.merge(obj, extension);
        }

    });


})();
