(function() {
    "use strict";

    describe("Geofire Option", function() {
        var firePath, rec1, rec2, differentLocation, phones, phone, geofire, differentSession, keyMock, location, $timeout, arrData, newData, newRecord, test1, session, lastRecs, recRemoved, rootPath, copy, keys, testutils, root, success, failure, recAdded, sessionSpy, locData, userId, maSpy, maSpy1, mrSpy, naSpy, nrSpy, fsMocks, geo, test, ref, objRef, objCount, arrCount, arrRef, $rootScope, data, user, location, locationSpy, $injector, inflector, fsType, userSpy, fsPath, options, fbObject, fbArray, pathSpy, $provide, fuel, subject, path, fireStarter, $q, $log;

        beforeEach(function() {
            rootPath = "https://your-firebase.firebaseio.com";
            arrData = [{
                phone: "123456890",
                uid: 1,
                firstName: "tom"

            }, {
                phone: "0987654321",
                uid: 2,
                firstName: "frank"
            }, {
                phone: "1221",
                uid: 2,
                firstName: "frank again"
            }, {
                phone: "1990",
                uid: 1,
                firstName: "tom again"
            }];

            newData = {
                phone: "111222333",
                key: function() {
                    return "key";
                },
                firstName: "sally"
            };

            newRecord = {
                phone: "111222333",
                firstName: "sally"
            };

            locData = [{
                lat: 90,
                lon: 100,
                place_id: "string",
                placeType: "a place",
                distance: 1234,
                closeBy: true
            }, {
                lat: 45,
                lon: 100,
                place_id: "different_place",
                placeType: "some place",
                distance: 1000,
                closeBy: false
            }];
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
            angular.module("firebase.fuel")
                .config(function(fuelConfigurationProvider) {
                    fuelConfigurationProvider.setRoot(rootPath);
                })
                .factory("location", function($q) {
                    var location = {
                        add: keyMock("add", $q),
                        removeoc: keyMock("remove", $q),

                    };

                    return location;

                })
                .factory("differentLocation", function($q) {
                    var location = {
                        add: function(data, flag) {
                            if (flag === true) {
                                delete data.lat;
                                delete data.lon;
                            }
                            ref = new MockFirebase("locations")
                            ref.set(data);
                            ref.flush();
                            return ref;
                        }

                    };

                    return location;

                })
                .factory("geofire", function($q) {
                    var geofire = {
                        set: keyMock("set", $q),
                        remove: keyMock("remove", $q),
                        get: keyMock("get", $q),

                    };

                    return geofire;

                })
                .factory("user", function($q) {
                    var user = {
                        addIndex: keyMock("addIndex", $q),
                        removeIndex: keyMock("removeIndex", $q),
                        getIndexKeys: function() {
                            return "spy";
                        }
                    };

                    return user;
                })
                .factory("session", function() {
                    return {
                        getId: function() {}
                    }
                })
                //just making sure nested array methods dont confuse
                //injected services
                .factory("phone", function() {
                    return {
                        getId: function() {}
                    }
                })
                .factory("phones", function() {
                    return {
                        getId: function() {}
                    }
                })
                .factory("differentSession", function() {
                    return {
                        differentMeth: function() {}
                    }
                });

            module("testutils");
            module("firebase.fuel");

            inject(function(_user_, _phones_, _differentLocation_, _phone_, _testutils_, _differentSession_, _location_, _geofire_, _$timeout_, _$log_, _firePath_, _session_, _$rootScope_, _fuel_, _inflector_, _fireStarter_, _$q_) {
                differentLocation = _differentLocation_;
                differentSession = _differentSession_;
                phones = _phones_;
                phone = _phone_;
                geofire = _geofire_;
                user = _user_
                $timeout = _$timeout_;
                location = _location_;
                testutils = _testutils_;
                session = _session_;
                $rootScope = _$rootScope_;
                inflector = _inflector_;
                firePath = _firePath_;
                fuel = _fuel_;
                fireStarter = _fireStarter_;
                $q = _$q_;
                $log = _$log_;
            });

            spyOn($q, "reject").and.callThrough();
            spyOn($log, "info").and.callThrough();
            subject = fuel("geofire", {
                geofire: true
            });
        });
        afterEach(function() {
            location = null;
            subject = null;
            fireStarter = null;
            firePath = null;
            fuel = null;
        });
        describe("Commands", function() {
            describe("*Single Record*", function() {
                beforeEach(function() {
                    test = subject.add(locData[0]);
                    $rootScope.$digest();
                    this.key = subject.ref()._lastAutoId;
                    this.mainRef = subject.ref().child(this.key);
                    flush();
                    this.ptsPath = subject.path();
                    $timeout.flush();
                    subject.ref().flush();
                    $rootScope.$digest();
                });
                describe("add", function() {
                    useParentRef();
                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should remove coordinates from main array", function() {
                        var d = this.mainRef;
                        expect(d).toBeDefined();
                        expect(d.toString()).toEqual(rootPath + "/geofire/" + this.key);
                        expect(d.lat).not.toBeDefined();
                        expect(d.lon).not.toBeDefined();
                    });
                    it("should save data to main array", function() {
                        var d = this.mainRef.getData();
                        expect(d.place_id).toEqual("string");
                    });
                    it("should add coordinates to coordinates node", function() {
                        expect(getPromValue(test)[0].child(this.key).getData()).toEqual({
                            "g": jasmine.any(String),
                            "l": [90, 100]
                        });
                    });
                    it("should set current ref to main array record", function() {
                        expect(getPromValue(test).toString()).toEqual(rootPath + "/geofire/" + this.key);
                        expect(this.ptsPath).toEqual(rootPath + "/geofire/" + this.key);
                    });
                    qReject(0);
                });
                describe("remove", function() {
                    beforeEach(function() {
                        this.gNode = subject.ref().child("points");
                        this.c1data = this.gNode.child(this.key).getData();
                        subject.load();
                        flush();
                        test1 = subject.remove(this.key);
                        flushTime();
                    });
                    it("should be a promise", function() {
                        expect(test1).toBeAPromise();
                    });
                    it("should remove data from main array", function() {
                        var p = subject.ref().getData();
                        expect(p).toEqual(null);
                    });
                    it("should remove the points from points node", function() {
                        var p = subject.ref().child("points").getData();
                        expect(p).toEqual(null);

                    });
                    it("should set ref to mainref", function() {
                        expect(getPromValue(test1)[0]).toBeAFirebaseRef();
                        expect(subject.path()).toEqual(rootPath + "/geofire");
                    });
                    qReject(0);
                });
            });
            describe("*Multiple Records", function() {
                beforeEach(function() {
                    test = subject.add(locData);
                    flushTime();
                    flushTime();
                    this.keys = Object.keys(subject.ref().parent().children);
                    this.mainRef = subject.ref().root().child("geofire");
                    rec1 = this.mainRef.child(this.keys[0]);
                    rec2 = this.mainRef.child(this.keys[1]);
                });
                describe("add()", function() {
                    useParentRef();
                    it("should be a promise", function() {
                        expect(this.keys).toBeAn("array");
                        expect(test).toBeAPromise();
                    });
                    it("should remove coordinates from main array records", function() {
                        expect(rec1.getData()).toBeDefined();
                        expect(rec1.getData().lat).not.toBeDefined();
                        expect(rec1.getData().lon).not.toBeDefined();
                        expect(rec2.getData()).toBeDefined();
                        expect(rec2.getData().lat).not.toBeDefined();
                        expect(rec2.getData().lon).not.toBeDefined();
                    });
                });
                it("should save data to main array", function() {
                    expect(rec1.getData()).toEqual({
                        place_id: "string",
                        placeType: "a place",
                        distance: 1234,
                        closeBy: true
                    });
										
                    // expect(rec2.getData()).toEqual({
                    //     place_id: "different_place",
                    //     placeType: "some place",
                    //     distance: 1000,
                    //     closeBy: false
                    // });
                });
                it("should add coordinates to coordinates node", function() {
                    // expect(getPromValue(test)[0].root().child("geofire/points").getData()).toEqual({
                    //     "g": jasmine.any(String),
                    //     "l": [90, 100]
                    // });
                    // expect(getPromValue(test)).toEqual({
                        // "g": jasmine.any(String),
                        // "l": [90, 100]
                    // });
                    // expect(getPromValue(test)[1].getData()).toEqual({
                    //     "g": jasmine.any(String),
                    //     "l": [45, 100]
                    // });
										// expect(getPromValue(test)).toEqual("as");
                });
                // it("should set current ref to main array record", function() {
                //     expect(getPromValue(test).toString()).toEqual(rootPath + "/geofire/" + this.key);
                //     expect(this.ptsPath).toEqual(rootPath + "/geofire/" + this.key);
                // });
                // qReject(0);
                // });
                // describe("remove", function() {
                // beforeEach(function() {
                //     this.gNode = subject.ref().child("points");
                //     this.c1data = this.gNode.child(this.key).getData();
                //     subject.load();
                //     flush();
                //     test1 = subject.remove(this.key);
                //     flushTime();
                // });
                // it("should be a promise", function() {
                //     expect(test1).toBeAPromise();
                // });
                // it("should remove data from main array", function() {
                //     var p = subject.ref().getData();
                //     expect(p).toEqual(null);
                // });
                // it("should remove the points from points node", function() {
                //     var p = subject.ref().child("points").getData();
                //     expect(p).toEqual(null);

                // });
                // it("should set ref to mainref", function() {
                //     expect(getPromValue(test1)[0]).toBeAFirebaseRef();
                //     expect(subject.path()).toEqual(rootPath + "/geofire");
                // });
                // qReject(0);


            });
        });

        describe("get", function() {
            beforeEach(function() {
                subject.set("keyOne", [90, 100]);
                subject.set("key2", [50, 100]);
                flushTime();
                test = subject.get("keyOne");
                $rootScope.$digest();
                $timeout.flush();
                $rootScope.$digest();
            });
            it("should be a promise", function() {
                expect(test).toBeAPromise();
            });
            it("should retrieve the correct record", function() {
                expect(flushData(subject.ref()).key()).toEqual("keyOne");
                expect(flushData(subject.ref()).getData()).toEqual({
                    "g": jasmine.any(String),
                    "l": [90, 100]
                });
            });

        });
        describe("query", function() {
            beforeEach(function() {
                subject.set("key2", [50, 100]);
                flushTime();
                extendMockFb(subject.ref());
                test = subject.query({
                    center: [90, 100],
                    radius: 10
                });
                $rootScope.$digest();
                $timeout.flush();
            });
            it("should be a promise", function() {
                expect(test).toBeAPromise();
            });
            it("should retrieve the correct record", function() {
                expect(subject.path()).toEqual(rootPath + "/geofire/points");
            });
            it("should return a geoQuery", function() {
                expect(getPromValue(test)).toEqual(jasmine.objectContaining({
                    updateCriteria: jasmine.any(Function),
                    radius: jasmine.any(Function),
                    center: jasmine.any(Function),
                    cancel: jasmine.any(Function),
                    on: jasmine.any(Function)
                }));
            });
        });

        function updateCheck() {
            it("should save new time for updatedAt", function() {
                expect(getPromValue(test).getData().updatedAt).toEqual(jasmine.any(Number));
                expect(getPromValue(test).getData().updatedAt).not.toEqual(this.updateTime);
            });
            it("should not changed createdAt", function() {
                expect(getPromValue(test).getData().createdAt).toEqual(this.createTime);
            });
        }

        function createCheck() {
            it("should add createdAt and updatedAt properties", function() {
                expect(subject.ref().getData().createdAt).toEqual(jasmine.any(Number));
                expect(subject.ref().getData().updatedAt).toEqual(jasmine.any(Number));
            });
        }

        function fq(ref) {
            return ref.getFlushQueue();
        }

        function wrapPromise(p) {
            return p.then(success, failure);
        }

        function getPromValue(obj) {
            return obj.$$state.value;
        }

        function pathCheck(path, flag) {
            var root = "https://your-firebase.firebaseio.com/";
            if (flag === true) {
                return expect(subject.ref().path).toEqual(root.concat(path));
            } else {
                it("should set the correct ref with childPath: " + path, function() {
                    expect(subject.ref().path).toEqual(root.concat(path));
                });
            }
        }

        function refCheck(path, flag) {
            if (flag === true) {
                return expect(subject.ref()).toEqual("as");
            } else {
                it("should set the correct ref with childPath: " + path, function() {
                    expect(subject.ref()).toEqual("as");
                });
            }
        }

        function baseCheck(type, val, id) {
            switch (type) {
                case "object":
                    expect(val).toEqual(jasmine.objectContaining({
                        $id: id,
                        $priority: null,
                        $ref: jasmine.any(Function),
                        $value: null
                    }));
                    break;
                case "array":
                    expect(val).toEqual(jasmine.objectContaining({
                        $keyAt: jasmine.any(Function),
                        $indexFor: jasmine.any(Function),
                        $remove: jasmine.any(Function),
                        $getRecord: jasmine.any(Function),
                        $add: jasmine.any(Function),
                        $watch: jasmine.any(Function)
                    }));
                    break;
            }
        }

        function logContains(message) {
            it("should call $log.info with " + message, function() {
                var logArray = $log.info.calls.allArgs();
                var flatLog = logArray.reduce(function(x, y) {
                    return x.concat(y);
                }, []);
                expect(flatLog.indexOf(message)).toBeGreaterThan(-1);
            });
        }

        function logCount(x, flag) {
            if (flag === true) {
                return expect($log.info.calls.count()).toEqual(x);
            } else {
                it("should call $log.info " + x + " times", function() {
                    expect($log.info.calls.count()).toEqual(x);
                });
            }
        }

        function testCheck(x, flag) {
            if (flag === true) {
                return expect(test).toEqual(x);
            } else {
                it("should work", function() {
                    expect(test).toEqual(x);
                });
            }
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

        function logNum(x, message, flag) {
            if (flag === true) {
                return expect($log.info.calls.argsFor(x)).toEqual(message);
            } else {
                it("should log:" + message, function() {
                    expect($log.info.calls.argsFor(x)).toEqual(message);
                });
            }
        }

        function qReject(x, flag) {
            if (flag === true) {
                expect($q.reject.calls.allArgs()).toEqual([]);
                expect($q.reject.calls.count()).toEqual(x);
            } else {
                it("should call $q.reject " + x + " times", function() {
                    expect($q.reject.calls.allArgs()).toEqual([]);
                    expect($q.reject.calls.count()).toEqual(x);
                });
            }

        }


        function useParentRef() {
            it("should construct firebase from parentRef", function() {
                logContains("Using parent");
            });
        }

        function useCurrentRef() {
            it("should reuse ref", function() {
                logContains("Reusing ref");
            });
        }

        function inspect(x) {
            if (angular.isObject(x)) {
                it("should be inspected", function() {
                    expect(x.inspect()).toEqual("inspect!");
                });
            } else {
                it("should be inspected", function() {
                    expect(subject.inspect()).toEqual("inspect!");
                });

            }
        }

        function subject(x) {
            if (angular.isObject(x)) {
                it("should be the subject", function() {
                    expect(x).toEqual("subject!");
                });
            } else {
                it("should be the subject", function() {
                    expect(subject.inspect()).toEqual("heres the subject!");
                });

            }
        }


        function dataKeys(ref) {
            return Object.keys(ref.getData());
        }

        function childKeys(node) {
            if (!node) {
                return Object.keys(subject.ref().children);
            } else {
                return Object.keys(subject.ref().child(node).getData());
            }
        }


        function flush() {
            $rootScope.$digest();
            subject.ref().flush();
            $rootScope.$digest();
        }

        function flushTime() {
            $rootScope.$digest();
            $timeout.flush();
            subject.ref().flush();
            $rootScope.$digest();
        }

        function extendMockFb(obj) {
            var querySpy = {
                startAt: function() {
                    return {
                        endAt: function() {
                            return {
                                on: function() {}
                            }

                        }
                    }
                },
            };
            var extension = {
                orderByChild: jasmine.createSpy("child").and.returnValue(querySpy)
            };
            angular.extend(obj, extension);
            return obj;
        }

        function flushData(ref, key) {
            if (!ref) {
                ref = subject.ref();
            }
            if (key) {
                return ref.getFlushQueue()[0].context[key];
            } else {
                return ref.getFlushQueue()[0].context;

            }
        }


        //from angularFire repo
        var flushAll = (function() {
            return function flushAll() {
                Array.prototype.slice.call(arguments, 0).forEach(function(o) {
                    o.flush();
                });
                try {
                    $timeout.flush();
                } catch (e) {}
            }
        })();

    });



})();
