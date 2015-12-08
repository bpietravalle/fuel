(function() {
    "use strict";

    describe("Fuel Factory", function() {
        var firePath, differentLocation, phones, phone, geofire, differentSession, keyMock, location, $timeout, arrData, newData, newRecord, test1, session, lastRecs, recRemoved, rootPath, copy, keys, testutils, root, success, failure, recAdded, sessionSpy, locData, userId, maSpy, maSpy1, mrSpy, naSpy, nrSpy, fsMocks, geo, test, ref, objRef, objCount, arrCount, arrRef, $rootScope, data, user, location, locationSpy, $injector, inflector, fsType, userSpy, fsPath, options, fbObject, fbArray, pathSpy, $provide, fuel, subject, path, fireStarter, $q, $log;

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
                        addLoc: keyMock("add", $q),
                        removeLoc: keyMock("remove", $q),

                    };

                    return location;

                })
                .factory("differentLocation", function($q) {
                    var location = {
                        addLoc: function(path, data, flag) {
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
            spyOn(session, "getId").and.returnValue('1');
        });
        afterEach(function() {
            location = null;
            subject = null;
            fireStarter = null;
            firePath = null;
            fuel = null;
        });


        describe("With Session Access", function() {
            describe("With default location and method", function() {
                beforeEach(function() {
                    subject = fuel("trips", {
                        session: true
                    });
                });
                describe("addIndex", function() {
                    beforeEach(function() {
                        test = subject.addIndex(null, "hotels", "uniqueKey");
                        flushTime();
												this.node = subject.ref().root().child("trips/1/hotels");
                    });
                    it("should add the sessionId", function() {
                        expect(session.getId.calls.count()).toEqual(1);
                    });
										it("should add the sessionId correctly",function(){
											expect(this.node.getData()["uniqueKey"]).toBeTruthy();

										});

                });
                describe("current", function() {
                    beforeEach(function() {
                        subject = fuel("users", {
                            session: true
                        });
                        test = subject.current();
                        flushTime();
                    });
                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should resolve to a $firebaseObject", function() {
                        baseCheck("object", getPromValue(test), '1');
                    });
                    it("should update currentRef", function() {
                        expect(subject.ref()).toEqual(getPromValue(test).$ref());
                    });
                    it("should update base", function() {
                        expect(subject.base()).toEqual(getPromValue(test));
                    });
                });
//                 // describe("saveCurrent", function() {
//                 //     beforeEach(function() {
//                 //         subject = fuel("users", {
//                 //             session: true
//                 //         });
//                 //         spyOn(session, "getId").and.returnValue(1);
//                 //         test = subject.saveCurrent(arrData[0]);
//                 // flush();
//                 //     });
//                 //     it("should be a promise", function() {
//                 //         expect(test).toBeAPromise();
//                 //     });
//                 //     it("should resolve to a firebaseRef", function() {
//                 //         expect(getPromValue(test)).toBeAFirebaseRef();
//                 // //error
//                 //         expect(getPromValue(test).getData()).toEqual(null);
//                 //     });
//                 // it("should update currentRef",function(){
//                 // expect(subject.ref()).toEqual(getPromValue(test));
//                 // // expect(subject.ref().getData()).toEqual(arrData[0]);
//                 // });
//                 // // it("should update base",function(){
//                 // // 	expect(subject.base().$ref().getData()).toEqual(arrData[0]);
//                 // // });

//                 // });
                describe("bindCurrent", function() {
                    beforeEach(function() {
                        // subject.add(arrData[0]);
                        // flushTime();
                        // this.key = subject.ref().key();
                        this.scope = $rootScope.$new()
                    });
                    afterEach(function() {
                        this.scope = null;
                    });
                    describe("with passing key", function() {
                        beforeEach(function() {
                            test = subject.bindCurrent(this.scope, "testData");
                            flushTime();
                        });
                        it("should return a function", function() {
                            expect(getPromValue(test)).toEqual(jasmine.any(Function));
                        });
                        it("should set watcher count to 1", function() {
                            expect(this.scope["$$watchersCount"]).toEqual(1);
                        });
                        it("should add initial data to scope under correct variable name", function() {
                            expect(this.scope['testData']).toEqual({
                                $id: '1',//this.key,
                                $priority: null,
																$value: null
                                // phone: "123456890",
                                // uid: 1,
                                // firstName: "tom"
                            });

                        });
                    });
                });
            });
            describe("With different location and method", function() {
                beforeEach(function() {
                    subject = fuel("trips", {
                        session: true,
                        sessionService: "differentSession",
                        sessionIdMethod: "differentMeth"
                    });
                });
                describe("bindCurrent", function() {
                    beforeEach(function() {
                        subject.add(arrData[0]);
                        flushTime();
                        this.key = subject.ref().key();
                        spyOn(differentSession, "differentMeth").and.returnValue(this.key);
                        this.scope = $rootScope.$new()
                    });
                    afterEach(function() {
                        this.scope = null;
                    });
                    describe("with passing key", function() {
                        beforeEach(function() {
                            test = subject.bindCurrent(this.scope, "testData");
                            flushTime();
                        });
                        it("should not call the default session location", function() {
                            expect(session.getId).not.toHaveBeenCalled();
                        });
                        it("should return a function", function() {
                            expect(getPromValue(test)).toEqual(jasmine.any(Function));
                        });
                        it("should set watcher count to 1", function() {
                            expect(this.scope["$$watchersCount"]).toEqual(1);
                        });
                        it("should add initial data to scope under correct variable name", function() {
                            expect(this.scope['testData']).toEqual({
                                $id: this.key,
                                $priority: null,
																$value: null
                                // phone: "123456890",
                                // uid: 1,
                                // firstName: "tom"
                            });

                        });
                    });
                });
            });
        });
        describe("With User Option", function() {
            beforeEach(function() {
                options = {
                    user: true
                };
                subject = fuel("trips", options);
            });
            describe("Commands: ", function() {
                describe("add", function() {
                    beforeEach(function() {
                        test = subject.add(newRecord);
                        flushTime();
                        this.mainKey = getPromValue(test)[1].key();
                    });
                    it("should return an array with two items", function() {
                        expect(getPromValue(test)).toHaveLength(2);
                        expect(getPromValue(test)).toEqual(jasmine.any(Array));
                    });
                    it("should call user addIndex with main array key", function() {
                        expect(this.mainKey).toEqual(jasmine.any(String));
                        expect(user.addIndex).toHaveBeenCalledWith(null, "trips", this.mainKey);
                    });
                    it("array item #1 = firebaseRef of userIndex", function() {
                        expect(getPromValue(test)[0].key()).toEqual("addIndexKey");
                    });
                    it("array item #2 = firebaseRef of main Record", function() {
                        expect(getPromValue(test)[1]).toBeAFirebaseRef();
                        expect(getPromValue(test)[1].key()).toEqual(this.mainKey);
                    });
                    describe("uid option", function() {
                        describe("default", function() {
                            beforeEach(function() {
                                var data = {
                                    rec: newRecord,
                                    geo: locData
                                };
                                test = subject.add(data);
                                flushTime();
                            });
                            it("should add uid property to record", function() {
                                expect(getPromValue(test)[1].getData().uid).toEqual('1');
                                expect(getPromValue(test)[1].getData()).toBeDefined();
                            });
                        });
                        describe("if false", function() {
                            beforeEach(function() {
                                subject = fuel("trips", {
                                    user: true,
                                    uid: false
                                });
                                var data = {
                                    rec: newRecord,
                                    geo: locData
                                };
                                test = subject.add(data);
                                flushTime();
                            });
//                             // subject();
                            it("should not add uid property to record", function() {
                                expect(getPromValue(test)[1].getData().uid).not.toBeDefined();
                                expect(getPromValue(test)[1].getData()).toBeDefined();
                            });

                        });
                    });
                    describe("remove", function() {
                        beforeEach(function() {
                            this.mainKey = getPromValue(test)[1].key();
                            test = subject.remove(this.mainKey);
                            flushTime();
                        });
                        it("should return an array with two items", function() {
                            expect(getPromValue(test)).toHaveLength(2);
                            expect(getPromValue(test)).toEqual(jasmine.any(Array));
                        });
                        it("should call user addIndex with main array key", function() {
                            expect(this.mainKey).toEqual(jasmine.any(String));
                            expect(user.removeIndex).toHaveBeenCalledWith(null, "trips", this.mainKey);

                        });
                        it("array item #1 = firebaseRef of userIndex", function() {
                            expect(getPromValue(test)[0].key()).toEqual("removeIndexKey");
                        });
                        it("array item #2 = firebaseRef of main Record", function() {
                            expect(getPromValue(test)[1]).toBeAFirebaseRef();
                        });
                    });
//                     describe("saveWithUser", function() {});
                });
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
