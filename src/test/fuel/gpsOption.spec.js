(function() {
    "use strict";

    describe("Fuel Factory", function() {
        var i, nameArr, diffLoc, firePath, differentLocation, phones, phone, geofire, differentSession, keyMock, location, $timeout, arrData, newData, newRecord, test1, session, lastRecs, recRemoved, rootPath, copy, keys, testutils, root, success, failure, recAdded, sessionSpy, locData, userId, maSpy, maSpy1, mrSpy, naSpy, nrSpy, fsMocks, geo, test, ref, objRef, objCount, arrCount, arrRef, $rootScope, data, user, location, locationSpy, $injector, inflector, fsType, userSpy, fsPath, options, fbObject, fbArray, pathSpy, $provide, fuel, subject, path, fireStarter, $q, $log;

        beforeEach(function() {
            nameArr = [];
            diffLoc = [];
            i = 0;
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

            function pushStr(s) {
                nameArr.push(s);
                return s;
            }

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
                    function getStr() {
                        var s = generateRandomString();
                        pushStr(s);
                        return s;
                    }
                    var location = {
                        addLoc: keyMock(getStr(), $q),
                        removeLoc: keyMock("remove", $q)

                    };

                    return location;

                })
                .factory("differentLocation", function($q) {
                    var location = {
                        addLoc: jasmine.createSpy("addLoc").and.callFake(function(path, data, flag) {
                            if (flag === true) {
                                delete data.lat;
                                delete data.lon;
                            }

                            ref = new MockFirebase("locations").child(path);

                            ref.push(data);
                            ref.flush();
														var key = ref._lastAutoId;
                            diffLoc.push(key);
                            return $q.when(ref.child(key));
                        })

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
                .factory("differentSession", function() {
                    return {
                        differentMeth: function() {}
                    }
                });

            module("testutils");
            module("firebase.fuel");

            inject(function(_user_, _differentLocation_, _testutils_, _differentSession_, _location_, _geofire_, _$timeout_, _$log_, _firePath_, _session_, _$rootScope_, _fuel_, _inflector_, _fireStarter_, _$q_) {
                differentLocation = _differentLocation_;
                differentSession = _differentSession_;
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

            spyOn($q, "all").and.callThrough();
            spyOn($q, "reject").and.callThrough();
            spyOn($log, "info").and.callThrough();
        });
        afterEach(function() {
            location = null;
            subject = null;
            fireStarter = null;
            firePath = null;
            fuel = null;
        });

        // describe("With GPS Options", function() {
        //     beforeEach(function() {
        //         options = {
        //             gps: true,
										// locationService: "differentLocation"
        //         };
        //         subject = fuel("trips", options);
        //     });
        //     describe("Commands: ", function() {
        //         beforeEach(function() {
        //             test = subject.add(newRecord, locData);
        //             flush();
        //             this.data = subject.ref().getData();
        //             this.path = subject.path();
        //             this.key = subject.parent().key();
        //             $timeout.flush();
        //             flush();
        //             this.key1 = diffLoc[0];
        //             this.key2 = diffLoc[1];
        //         });
        //         describe("add()", function() {
        //             it("should be a promise", function() {
        //                 expect(test).toBeAPromise();
        //             });
        //             it("should add record to main array", function() {
        //                 var mainRef = subject.ref().root().child("trips/" + this.key);
        //                 var loc = mainRef.child("locations");
        //                 expect(mainRef.getData()).toEqual(jasmine.objectContaining(newRecord));
        //                 expect(loc.getData()[this.key1]).toEqual(true);
        //             });
        //             it("should not add uid property to main record", function() {
        //                 var mainRef = subject.ref().root().child("trips/" + this.key);
        //                 expect(mainRef.getData().uid).not.toBeDefined();
        //                 expect(mainRef.getData()).toBeDefined();
        //             });
        //             it("should not call user.addIndex", function() {
        //                 expect(user.addIndex).not.toHaveBeenCalled();
        //             });
        //             it("should call location.addLoc twice", function() {
        //                 expect(location.addLoc.calls.count()).toEqual(2);
        //             });
        //             it("should add both records to main location array", function() {
        //                 expect(location.addLoc.calls.argsFor(0)[0]).toEqual("trips");
        //                 expect(location.addLoc.calls.argsFor(0)[1]).toEqual(locData[0]);
        //                 expect(location.addLoc.calls.argsFor(0)[2]).toEqual(true);
        //                 expect(location.addLoc.calls.argsFor(1)[0]).toEqual("trips");
        //                 expect(location.addLoc.calls.argsFor(1)[1]).toEqual(locData[1]);
        //                 expect(location.addLoc.calls.argsFor(1)[2]).toEqual(true);
        //             });
        //             it("should call geofire.set() twice", function() {
        //                 expect(geofire.set.calls.count()).toEqual(2);
        //             });
        //             it("should call geofire object with correct path, main location key and coordinates", function() {
        //                 expect(geofire.set.calls.argsFor(0)[0]).toEqual("trips");
        //                 expect(geofire.set.calls.argsFor(0)[1]).toEqual(this.key1);
        //                 expect(geofire.set.calls.argsFor(0)[2]).toEqual([90, 100]);
        //                 expect(geofire.set.calls.argsFor(1)[0]).toEqual("trips");
        //                 // expect(geofire.set.calls.argsFor(1)[1]).not.toEqual(this.key1);
        //                 // expect(geofire.set.calls.argsFor(1)[1]).toEqual(this.key2);
        //                 expect(geofire.set.calls.argsFor(1)[2]).toEqual([45, 100]);
        //             });
        //             it("should add location index to main record and set ref to main record", function() {
        //                 expect(this.path).toEqual(rootPath + "/trips/" + this.key + "/locations");
        //                 expect(this.data).toEqual(null);
        //                 $rootScope.$digest();
        //                 expect(subject.ref().child("locations").getData()[this.key1]).toEqual(true);
        //                 expect(subject.path()).toEqual(rootPath + "/trips/" + this.key);
        //             });
        //             qReject(0);
        //         });

        //         describe("remove()", function() {
        //             beforeEach(function() {
        //                 this.idxKey = Object.keys(subject.ref().child("locations").getData())[0];
        //                 test = subject.remove(this.key);
        //                 $rootScope.$digest();
        //                 flush();
        //                 flush();
        //             });
        //             it("should remove location with key from index", function() {
        //                 expect(this.idxKey).toEqual(diffLoc[0]);
        //                 expect(location.removeLoc).toHaveBeenCalledWith(this.idxKey);
        //             });
        //             it("should call remove on geofire with key from main location array", function() {
        //                 expect(geofire.remove).toHaveBeenCalledWith('trips', "removeKey");
        //             });
        //             it("should remove the data from firebase", function() {
        //                 expect(subject.ref().getData()).toEqual(null);
        //             });
        //             it("should return the firebaseRef from the removed record", function() {
        //                 expect(subject.path()).toEqual(rootPath + "/trips/" + this.key);
        //             });
        //             it("should not call user.removeIndex()", function() {
        //                 expect(user.removeIndex).not.toHaveBeenCalled();
        //             });
        //             qReject(0);
        //         });
        //     });
        //     describe("Separating Location Data", function() {
        //         beforeEach(function() {
        //             subject = fuel("trips", {
        //                 gps: true,
        //                 locationService: "differentLocation"
        //             });
        //             test = subject.createLocation(locData[0]);
        //             $rootScope.$digest();
        //             $rootScope.$digest();
        //         });
        //         it("should not save coordinate data to location array", function() {
        //             expect(getPromValue(test)[0]).toBeAFirebaseRef();
        //             expect(dataKeys(getPromValue(test)[0])).toBeDefined();
        //             expect(dataKeys(getPromValue(test)[0]).lat).not.toBeDefined();
        //             expect(dataKeys(getPromValue(test)[0]).lon).not.toBeDefined();
        //         });
        //         it("should call geofire object with correct path, main location key and coordinates", function() {
        //             expect(geofire.set.calls.argsFor(0)[0]).toEqual("trips");
        //             expect(geofire.set.calls.argsFor(0)[1]).toEqual(diffLoc[0]);
        //             expect(geofire.set.calls.argsFor(0)[2]).toEqual([90, 100]);
        //         });
        //         qReject(0);
        //     });
        // });



        function qCalls(y) {
            describe("With " + y + " cycles", function() {
                it("q$ 1", function() {
                    expect($q.all.calls.argsFor(0)).toEqual(0);
                });
                it("q$ 2", function() {
                    expect($q.all.calls.argsFor(1)).toEqual(1);
                });
                it("q$ 3", function() {
                    expect($q.all.calls.argsFor(2)).toEqual(2);
                });
                it("q$ 4", function() {
                    expect($q.all.calls.argsFor(3)).toEqual(3);
                });
            })
        }

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

        /** from geofire-js */
        function generateRandomString() {
            var possibleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var numPossibleCharacters = possibleCharacters.length;

            var text = "";
            for (var i = 0; i < 10; i++) {
                text += possibleCharacters.charAt(Math.floor(Math.random() * numPossibleCharacters));
            }

            return text;
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
