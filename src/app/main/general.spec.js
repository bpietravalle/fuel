(function() {
    "use strict";

    describe("General", function() {
        var keyMock, $rootScope, options, fuel, subject, $q, $log;

        beforeEach(function() {
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
            module("firebase.fuel",
                function($provide) {
                    $provide.factory("location", function($q) {
                        var location = {
                            add: keyMock("add", $q),
                            removeLoc: keyMock("remove", $q)

                        };

                        return location;

                    });
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
                    })
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


        describe("firebaseRef mngt", function() {
            beforeEach(function() {
                subject = fuel("trips", options);
                $rootScope.$digest();
            });

            describe("ref", function() {
                it("should be defined on initialization", function() {
                    expect(subject.ref()).toBeDefined();
                });
            });
            describe("path", function() {
                it("should be defined on initalization", function() {
                    expect(subject.path()).toBeDefined();
                });
            });
        });
        describe("Options", function() {
            function definedMeth(y) {
                it(y + "() should be a defined method", function() {
                    expect(subject[y]).toBeDefined();
                    expect(subject[y]).toEqual(jasmine.any(Function));
                });
            }

            function defaultValues(y) {
                it("should have a default for " + y[0] + " of: " + y[1], function() {
                    expect(subject.inspect(y[0])).toEqual(y[1]);
                });
            }

            var sessionAdded = ["session", "sessionId", "bindCurrent"];
            var geofireAdded = ["get", "remove", "set", "add", "query", "addRecordKey", "geofire"];
            var gpsAdded = ["addLocations", "removeLocations", "getLocation","removeCoords","setCoords","getCoords","getLocation"];
            var userAdded = ["loadUserRecords"];
            var noOptionApi = ["base", "ref", "path", 
                "inspect", "addIndex", "removeIndex", "getIndexKeys", "load",
                "getRecord", "save", "bindTo", "add", "remove"
            ];
            var defaultNodes = [
                ["userNode", "users"],
                ["geofireNode", "geofire"]
            ];
            var defaultServices = [
                ["userService", "user"],
                ["sessionService", "session"],
                ["geofireService", "geofire"]
            ];
            var defaultProps = [
                ["createTime", "createdAt"],
                ["updateTime", "updatedAt"],
                ["points", "trips"],
                ["longitude", "lon"],
                ["latitude", "lat"],
                ["sessionIdMethod", "getId"],
                ["uid", true],
                ["uidProperty", "uid"]
            ];
            var coreDefaults = [
                ["geofire", false],
                ["gps", false],
                ["nestedArrays", []],
                ["timeStamp", false],
                ["session", false],
                ["user", false]
            ];

            describe("Basic API", function() {
                beforeEach(function() {
                    subject = fuel("trips");
                });
                noOptionApi.forEach(definedMeth);

            });

            describe("Added methods with User Option", function() {
                beforeEach(function() {
                    subject = fuel("trips", {
                        user: true
                    });
                });
                sessionAdded.forEach(definedMeth);
                userAdded.forEach(definedMeth);
            });
            describe("Added methods with GPS Option", function() {
                beforeEach(function() {
                    subject = fuel("trips", {
                        gps: true
                    });
                });
                gpsAdded.forEach(definedMeth);
            });
            describe("Added methods with Geofire Option", function() {
                beforeEach(function() {
                    subject = fuel("trips", {
                        geofire: true
                    });
                });
                geofireAdded.forEach(definedMeth);
            });
            describe("Added methods with session Option", function() {
                beforeEach(function() {
                    subject = fuel("trips", {
                        session: true
                    });
                });
                sessionAdded.forEach(definedMeth);
            });
            describe("Default Settings", function() {
                describe("Core: ", function() {
                    beforeEach(function() {
                        subject = fuel("trips");
                    });
                    coreDefaults.forEach(defaultValues);
                });
                beforeEach(function() {
                    subject = fuel("trips", {
                        user: true,
                        gps: true,
                        timeStamp: true
                    });
                });
                describe("Nodes: ", function() {
                    defaultNodes.forEach(defaultValues);
                });
                describe("Services: ", function() {
                    defaultServices.forEach(defaultValues);
                });
                describe("Properties: ", function() {
                    defaultProps.forEach(defaultValues);
                });
            });
            describe("Invalid Options", function() {

                var opts = ["gps", "user"];

                function invalidOpt(y) {
                    it("should throw error if select geofire and " + y, function() {
                        var options = {};

                        options['geofire'] = true;
                        options[y] = true;
                        expect(function() {
                            fuel("trips", options);
                        }).toThrow();
                    });
                }

                opts.forEach(invalidOpt);
            });

        });




    });


})();
