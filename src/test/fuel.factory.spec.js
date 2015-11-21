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
                .constant("FBURL", "https://your-firebase.firebaseio.com/")
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
        });
        afterEach(function() {
            location = null;
            subject = null;
            fireStarter = null;
            firePath = null;
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

            var sessionAdded = ["session", "sessionId", "bindCurrent"];
            var geofireAdded = ["get", "remove", "set", "addLoc", "removeLoc"];
            var gpsAdded = ["createLocation", "removeLocation"];
            var userAdded = ["userRecordsByUID", "loadUserRecords"];
            var noOptionApi = ["base", "ref", "path", "parent", "pathHistory",
                "inspect", "addIndex", "removeIndex", "getIndexKeys", "load",
                "getRecord", "save", "bindTo", "add", "remove"
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

        });
        describe("Without Options", function() {
            beforeEach(function() {
                options = {};
                subject = fuel("trips", options);
            });
            describe("commands", function() {
                describe("add", function() {
                    beforeEach(function() {
                        test = subject.add(newRecord);
                        $rootScope.$digest();
                        subject.ref().flush();
                        $rootScope.$digest();
                        this.key = subject.ref().key();
                    });
                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should return a firebaseRef", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                    });
                    it("should change the ref() to the added record's ref", function() {
                        expect(subject.path()).toEqual("https://your-firebase.firebaseio.com/trips/" + this.key);
                    });
                    it("should save the data to firebaseRef", function() {
                        expect(getPromValue(test).getData()).toEqual(newRecord);
                    });
                });
                describe("save", function() {
                    beforeEach(function() {
                        $rootScope.$digest();
                        subject.ref().set(arrData);
                        $rootScope.$digest();
                    });
                    afterEach(function() {
                        this.name = null;
                        this.phone = null;

                    });
                    describe("If pass an array", function() {
                        beforeEach(function() {
                            subject.load();
                            $rootScope.$digest();
                            subject.ref().flush();
                            $rootScope.$digest();
                            this.name = subject.base()[0].firstName;
                            this.phone = subject.base()[1].phone;
                            subject.base()[0].firstName = "john jacob";
                            $rootScope.$digest();
                        });
                        describe("If second arg is the record", function() {
                            beforeEach(function() {
                                test = subject.save([subject.base(), subject.base()[0]]);
                                $rootScope.$digest();
                                subject.ref().flush();
                                $rootScope.$digest();

                            });
                            it("should save record if pass an arrary with [fireBaseArray, record]", function() {
                                expect(this.name).toEqual('tom');
                                expect(getPromValue(test).getData().firstName).toEqual("john jacob");
                            });
                            it("should return a promise", function() {
                                expect(test).toBeAPromise();
                            });
                            it("should resolve to the correct firebaseRef", function() {
                                expect(getPromValue(test)).toBeAFirebaseRef();
                                expect(getPromValue(test).path).toEqual(rootPath + "/trips/0");
                            });
                            qReject(0);
                        });
                        describe("If second arg is the record's index", function() {
                            beforeEach(function() {
                                test = subject.save([subject.base(), 0]);
                                $rootScope.$digest();
                                subject.ref().flush();
                                $rootScope.$digest();
                            });
                            it("should save record ", function() {
                                expect(this.name).toEqual('tom');
                                expect(getPromValue(test).getData().firstName).toEqual("john jacob");
                            });
                            it("should return a promise", function() {
                                expect(test).toBeAPromise();
                            });
                            it("should resolve to the correct firebaseRef", function() {
                                expect(getPromValue(test)).toBeAFirebaseRef();
                                expect(getPromValue(test).path).toEqual(rootPath + "/trips/0");
                            });
                            qReject(0);
                        });
                        describe("If second arg is the record's key", function() {
                            beforeEach(function() {
                                this.key = dataKeys(subject.ref())[0];
                                test = subject.save([subject.base(), this.key]);
                                $rootScope.$digest();
                                subject.ref().flush();
                                $rootScope.$digest();
                            });

                            it("should save record correctly", function() {
                                expect(this.name).toEqual('tom');
                                expect(getPromValue(test).getData().firstName).toEqual("john jacob");
                            });
                            it("should return a promise", function() {
                                expect(test).toBeAPromise();
                            });
                            it("should resolve to the correct firebaseRef", function() {
                                expect(getPromValue(test)).toBeAFirebaseRef();
                                expect(getPromValue(test).path).toEqual(rootPath + "/trips/0");
                            });
                            qReject(0);
                        });
                    });
                    describe("If pass record instead of array", function() {
                        beforeEach(function() {
                            subject.load(0);
                            $rootScope.$digest();
                            subject.ref().flush();
                            $rootScope.$digest();
                            this.name = subject.base().firstName;
                            subject.base().firstName = "john jacob";
                            $rootScope.$digest();
                            test = subject.save(subject.base());
                            $rootScope.$digest();
                            subject.ref().flush();
                            $rootScope.$digest();
                        });
                        it("should save record", function() {
                            expect(this.name).toEqual('tom');
                            expect(getPromValue(test).getData().firstName).toEqual("john jacob");
                        });
                        it("should return a promise", function() {
                            expect(test).toBeAPromise();
                        });
                        it("should resolve to the correct firebaseRef", function() {
                            expect(getPromValue(test)).toBeAFirebaseRef();
                            expect(getPromValue(test).path).toEqual(rootPath + "/trips/0");
                        });
                        it("should change the ref() to the saved record's ref", function() {
                            expect(subject.path()).toEqual("https://your-firebase.firebaseio.com/trips/0");
                        });
                        qReject(0);
                    });
                });
                describe("addIndex", function() {
                    beforeEach(function() {
                        test = subject.addIndex("1", "hotels", "string");
                        $rootScope.$digest();
                        $timeout.flush();
                        subject.ref().flush();
                        $rootScope.$digest();
                    });
                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should set ref to user Index", function() {
                        expect(subject.path()).toEqual(rootPath + "/trips/1/hotels");
                    });
                    it("should add data the user index", function() {
                        expect(subject.ref().getData()).toEqual({
                            "string": true
                        });
                    });
                    it("should return the firebaseRef of the user index", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                        expect(getPromValue(test).path).toEqual(subject.path());
                    });
                    qReject(0);
                });
                describe("removeIndex", function() {
                    beforeEach(function() {
                        test = subject.addIndex("1", "hotels", "string");
                        $rootScope.$digest();
                        $timeout.flush();
                        subject.ref().flush();
                        $rootScope.$digest();
                        test = subject.removeIndex("1", "hotels", "string");
                        $rootScope.$digest();
                        $timeout.flush();
                        subject.ref().flush();
                        $rootScope.$digest();
                    });
                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should set ref to user Index", function() {
                        expect(subject.path()).toEqual(rootPath + "/trips/1/hotels");
                    });
                    it("should remove the key from the user index", function() {
                        expect(getPromValue(test).getKeys()).toBeEmpty();
                        expect(subject.ref().getData()).toBe(null);
                    });
                    it("should return the firebaseRef of the user index", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                        expect(getPromValue(test).path).toEqual(subject.path());
                    });
                    qReject(0);
                });
                describe("removeMainRecord", function() {
                    beforeEach(function() {
                        $rootScope.$digest();
                        subject.ref().child("trips").push(arrData);
                        $rootScope.$digest();
                        test = subject.remove('0');
                        $rootScope.$digest();
                        subject.ref().flush();
                        $rootScope.$digest();
                    });
                    it("should remove the record and return a firebaseRef", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                        expect(getPromValue(test).getData()).toEqual(null);
                        expect(getPromValue(test).path).toEqual("https://your-firebase.firebaseio.com/trips/0");
                    });
                    it("should change the ref() to the removed record's ref", function() {
                        expect(subject.path()).toEqual("https://your-firebase.firebaseio.com/trips/0");
                    });
                    qReject(0);
                    useCurrentRef();
                });
                describe("bindTo", function() {
                    beforeEach(function() {
                        subject.add(arrData[0]);
                        flush();
                        this.key = subject.ref().key();
                        this.scope = $rootScope.$new()
                    });
                    afterEach(function() {
                        this.scope = null;
                    });
                    describe("with passing key", function() {
                        beforeEach(function() {
                            test = subject.bindTo(this.key, this.scope, "testData");
                            flush();
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
                                phone: "123456890",
                                uid: 1,
                                firstName: "tom"
                            });

                        });
                    });
                    describe("with passing a record", function() {
                        beforeEach(function() {
                            this.rec = subject.load(this.key);
                            flush();
                            test = subject.bindTo(this.rec, this.scope, "testData");
                            $rootScope.$digest();
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
                                phone: "123456890",
                                uid: 1,
                                firstName: "tom"
                            });

                        });
                    });
                });
            });
            describe("Queries", function() {
                describe("load", function() {
                    beforeEach(function() {
                        $rootScope.$digest();
                        subject.ref().push(arrData[0]);
                        subject.ref().flush();
                        $rootScope.$digest();
                        subject.ref().push(arrData[1]);
                        subject.ref().flush();
                        $rootScope.$digest();
                    });
                    describe("Without passing an argument", function() {
                        beforeEach(function() {
                            test = subject.load();
                            $rootScope.$digest();
                            subject.ref().flush();
                            $rootScope.$digest();
                            this.key = subject.base()[0].$id;
                        });
                        it("should return a promise", function() {
                            expect(test).toBeAPromise();
                        });
                        it("should be a $fireBaseArray", function() {
                            expect(getPromValue(test)).toEqual(jasmine.objectContaining({
                                $add: jasmine.any(Function),
                                $indexFor: jasmine.any(Function),
                                $ref: jasmine.any(Function),
                                $destroy: jasmine.any(Function),
                                $save: jasmine.any(Function),
                                $remove: jasmine.any(Function),
                                $getRecord: jasmine.any(Function)
                            }));
                        });
                        it("should be an array", function() {
                            expect(Array.isArray(getPromValue(test))).toBeTruthy();
                        });
                        it("should have length", function() {
                            expect(getPromValue(test)).toHaveLength(2);
                        });

                        describe("With passing an argument", function() {
                            beforeEach(function() {
                                test = subject.load(this.key);
                                $rootScope.$digest();
                                subject.ref().flush();
                                $rootScope.$digest();
                            });
                            it("should return a promise", function() {
                                expect(test).toBeAPromise();
                            });
                            it("should return the correct object", function() {
                                expect(getPromValue(test).$id).toEqual(this.key);
                                expect(getPromValue(test).$ref().getData()).toEqual(arrData[0]);
                            });
                            it("should not be an array", function() {
                                expect(Array.isArray(getPromValue(test))).not.toBeTruthy();
                            });

                        });
                    });
                });
                describe("getRecord", function() {
                    beforeEach(function() {
                        subject.ref().push(arrData[0]);
                        subject.ref().push(arrData[1]);
                        flush();
                        this.ref = subject.ref();
                        this.refKeys = dataKeys(this.ref);
                        test = subject.getRecord(this.refKeys[0]);
                        flush();
                    });
                    it("should work", function() {
                        expect(this.refKeys.length).toEqual(2)
                    });
                    qReject(0);
                    // logCheck(3);
                });
            });
        });
        describe("With Session Access", function() {
            describe("With default location and method", function() {
                beforeEach(function() {
                    subject = fuel("trips", {
                        session: true
                    });
                });
                describe("bindCurrent", function() {
                    beforeEach(function() {
                        subject.add(arrData[0]);
                        flush();
                        this.key = subject.ref().key();
                        spyOn(session, "getId").and.returnValue(this.key);
                        this.scope = $rootScope.$new()
                    });
                    afterEach(function() {
                        this.scope = null;
                    });
                    describe("with passing key", function() {
                        beforeEach(function() {
                            test = subject.bindCurrent(this.scope, "testData");
                            flush();
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
                                phone: "123456890",
                                uid: 1,
                                firstName: "tom"
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
                        flush();
                        this.key = subject.ref().key();
                        spyOn(session, "getId");
                        spyOn(differentSession, "differentMeth").and.returnValue(this.key);
                        this.scope = $rootScope.$new()
                    });
                    afterEach(function() {
                        this.scope = null;
                    });
                    describe("with passing key", function() {
                        beforeEach(function() {
                            test = subject.bindCurrent(this.scope, "testData");
                            flush();
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
                                phone: "123456890",
                                uid: 1,
                                firstName: "tom"
                            });

                        });
                    });
                });
            });
        });
        describe("With User Option", function() {
            beforeEach(function() {
                spyOn(session, "getId").and.returnValue(1);
                options = {
                    user: true
                };
                subject = fuel("trips", options);
            });
            describe("Commands: ", function() {
                describe("add", function() {
                    beforeEach(function() {
                        test = subject.add(newRecord);
                        flush();
                        this.mainKey = getPromValue(test)[1].key();
                    });
                    it("should return an array with two items", function() {
                        expect(getPromValue(test)).toHaveLength(2);
                        expect(getPromValue(test)).toEqual(jasmine.any(Array));
                    });
                    it("should call user addIndex with main array key", function() {
                        expect(this.mainKey).toEqual(jasmine.any(String));
                        expect(user.addIndex).toHaveBeenCalledWith(1, "trips", this.mainKey);

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
                                flush();
                            });
                            it("should add uid property to record", function() {
                                expect(getPromValue(test)[1].getData().uid).toEqual(1);
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
                                flush();
                            });
                            // subject();
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
                            flush();
                        });
                        it("should return an array with two items", function() {
                            expect(getPromValue(test)).toHaveLength(2);
                            expect(getPromValue(test)).toEqual(jasmine.any(Array));
                        });
                        it("should call user addIndex with main array key", function() {
                            expect(this.mainKey).toEqual(jasmine.any(String));
                            expect(user.removeIndex).toHaveBeenCalledWith(1, "trips", this.mainKey);

                        });
                        it("array item #1 = firebaseRef of userIndex", function() {
                            expect(getPromValue(test)[0].key()).toEqual("removeIndexKey");
                        });
                        it("array item #2 = firebaseRef of main Record", function() {
                            expect(getPromValue(test)[1]).toBeAFirebaseRef();
                        });
                    });
                    describe("saveWithUser", function() {});
                });
            });
            describe("Queries", function() {
                function pushTime(y) {
                    subject.ref().push(y);
                    subject.ref().flush();
                }
                beforeEach(function() {
                    $rootScope.$digest();
                    arrData.forEach(pushTime)
                    this.keys = Object.keys(subject.ref().children);
                    spyOn(user, "getIndexKeys").and.returnValue($q.when(this.keys));
                    test = subject.loadUserRecords();
                    flush();
                });
                it("should exist", function() {
                    expect(test).toBeAPromise();
                });
                it("should call user.getIndexKeys() with sessionid and path name", function() {
                    expect(user.getIndexKeys).toHaveBeenCalledWith(1, "trips");
                });
                it("should return array of firebaseObjects", function() {
                    expect(getPromValue(test)).toBeAn("array");
                    expect(getPromValue(test).length).toEqual(4);

                    function checkFb(y) {
                        expect(y.$ref()).toBeAFirebaseRef();
                        var meths = ["$id", "$priority", "$bindTo"];

                        function checkMeths(x) {
                            expect(y[x]).toBeDefined();
                        }
                        meths.forEach(checkMeths);
                    }
                    getPromValue(test).forEach(checkFb)
                });
                it("should set the ref() with each loaded item", function() {
                    // expect(subject.ref().key()).toEqual(this.keys[3]);
                });
            });
        });
        describe("With GPS Options", function() {
            beforeEach(function() {
                options = {
                    gps: true
                }
                subject = fuel("trips", options);
            });
            describe("Commands: ", function() {
                beforeEach(function() {
                    test = subject.add(newRecord, locData[0]);
                    $rootScope.$digest();
                    subject.ref().flush();
                    $rootScope.$digest();
                    this.key = subject.parent().key();
                });

                describe("add()", function() {
                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should add record to main array", function() {
                        var mainRef = subject.ref().root().child("trips/" + this.key);
                        expect(mainRef.getData()).toEqual(newRecord);
                    });
                    it("should not add uid property to main record", function() {
                        var mainRef = subject.ref().root().child("trips/" + this.key);
                        expect(mainRef.getData().uid).not.toBeDefined();
                        expect(mainRef.getData()).toBeDefined();
                    });
                    it("should not call user.addIndex", function() {
                        expect(user.addIndex).not.toHaveBeenCalled();
                    });
                    it("should add record to main location array", function() {
                        expect(location.addLoc).toHaveBeenCalledWith("trips", {
                            lat: 90,
                            lon: 100,
                            place_id: "string",
                            placeType: "a place",
                            distance: 1234,
                            closeBy: true
                        }, true);
                    });
                    it("should call geofire object with correct path, main location key and coordinates", function() {
                        expect(geofire.set).toHaveBeenCalledWith("trips", "addKey", [90, 100]);
                    });
                    it("should add location index to main record and set ref to main record", function() {
                        expect(subject.path()).toEqual(rootPath + "/trips/" + this.key + "/locations");
                        expect(subject.ref().getData()).toEqual(null);
                        $timeout.flush();
                        flush();
                        expect(subject.ref().child("locations").getData()).toEqual({
                            "addKey": true
                        });
                        expect(subject.path()).toEqual(rootPath + "/trips/" + this.key);
                    });
                    qReject(0);
                });
                describe("remove()", function() {
                    beforeEach(function() {
                        $timeout.flush();
                        flush();
                        this.idxKey = Object.keys(subject.ref().child("locations").getData())[0];
                        test = subject.remove(this.key);
                        $rootScope.$digest();
                        flush();
                        flush();
                    });
                    it("should remove location with key from index", function() {
                        expect(this.idxKey).toEqual("addKey");
                        expect(location.removeLoc).toHaveBeenCalledWith(this.idxKey);
                    });
                    it("should call remove on geofire with key from main location array", function() {
                        expect(geofire.remove).toHaveBeenCalledWith('trips', "removeKey");
                    });
                    it("should remove the data from firebase", function() {
                        expect(subject.ref().getData()).toEqual(null);
                    });
                    it("should return the firebaseRef from the removed record", function() {
                        expect(subject.path()).toEqual(rootPath + "/trips/" + this.key);
                    });
                    it("should not call user.removeIndex()", function() {
                        expect(user.removeIndex).not.toHaveBeenCalled();
                    });
                    qReject(0);
                });

            });
            describe("Separating Location Data", function() {
                beforeEach(function() {
                    subject = fuel("trips", {
                        gps: true,
                        locationService: "differentLocation"
                    });
                    test = subject.createLocation(locData[0]);
                    $rootScope.$digest();
                    $rootScope.$digest();
                });
                it("should not save coordinate data to location array", function() {
                    expect(dataKeys(getPromValue(test)[1])).toBeDefined();
                    expect(dataKeys(getPromValue(test)[1]).lat).not.toBeDefined();
                    expect(dataKeys(getPromValue(test)[1]).lon).not.toBeDefined();
                });
                it("should call geofire object with correct path, main location key and coordinates", function() {
                    expect(geofire.set.calls.argsFor(0)[0]).toEqual("trips");
                    expect(geofire.set.calls.argsFor(0)[2]).toEqual([90, 100]);
                });
            });
        });
        describe("With User And GPS Options", function() {
            beforeEach(function() {
                spyOn(session, "getId").and.returnValue(1);
                options = {
                    user: true,
                    gps: true
                }
                subject = fuel("trips", options);
            });
            describe("Commands: ", function() {
                beforeEach(function() {
                    test = subject.add(newRecord, locData[0]);
                    $rootScope.$digest();
                    subject.ref().flush();
                    $rootScope.$digest();
                    this.key = subject.parent().key();
                });

                describe("add()", function() {
                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should add record to main array", function() {
                        var mainRef = subject.ref().root().child("trips/" + this.key);
                        expect(mainRef.getData()).toEqual(newRecord);
                    });
                    it("should add uid property to main record", function() {
                        var mainRef = subject.ref().root().child("trips/" + this.key);
                        expect(mainRef.getData().uid).toEqual(1);
                    });
                    it("should call user.addIndex with correct path and main record key", function() {
                        expect(user.addIndex).toHaveBeenCalledWith(1, "trips", this.key);
                    });
                    it("should add record to main location array", function() {
                        expect(location.addLoc).toHaveBeenCalledWith("trips", {
                            lat: 90,
                            lon: 100,
                            place_id: "string",
                            placeType: "a place",
                            distance: 1234,
                            closeBy: true
                        }, true);
                    });
                    it("should call geofire object with correct path, main location key and coordinates", function() {
                        expect(geofire.set).toHaveBeenCalledWith("trips", "addKey", [90, 100]);
                    });
                    it("should add location index to main record and set ref to main record", function() {
                        expect(subject.path()).toEqual(rootPath + "/trips/" + this.key + "/locations");
                        expect(subject.ref().getData()).toEqual(null);
                        $timeout.flush();
                        flush();
                        expect(subject.ref().child("locations").getData()).toEqual({
                            "addKey": true
                        });
                        expect(subject.path()).toEqual(rootPath + "/trips/" + this.key);
                    });
                    qReject(0);
                });
                describe("remove()", function() {
                    beforeEach(function() {
                        $timeout.flush();
                        flush();
                        this.idxKey = Object.keys(subject.ref().child("locations").getData())[0];
                        test = subject.remove(this.key);
                        $rootScope.$digest();
                        flush();
                        flush();
                    });
                    // logCheck();
                    it("should remove location with key from index", function() {
                        expect(this.idxKey).toEqual("addKey");
                        expect(location.removeLoc).toHaveBeenCalledWith(this.idxKey);
                    });
                    it("should call remove on geofire with key from main location array", function() {
                        expect(geofire.remove).toHaveBeenCalledWith('trips', "removeKey");
                    });
                    it("should remove the data from firebase", function() {
                        expect(subject.ref().getData()).toEqual(null);
                    });
                    it("should return the firebaseRef from the removed record", function() {
                        expect(subject.path()).toEqual(rootPath + "/trips/" + this.key);
                    });
                    it("should call user.removeIndex() with correct key", function() {
                        expect(user.removeIndex).toHaveBeenCalledWith(1, 'trips', this.key);
                    });
                    qReject(0);
                });

            });
        });
        describe("With Geofire Option", function() {
            describe("Geofire API", function() {
                beforeEach(function() {
                    options = {
                        geofire: true
                    };
                    subject = fuel("geofire", options);
                });
                describe("set", function() {
                    beforeEach(function() {
                        test = subject.set("trips", "key", [90, 100]);
                        test1 = subject.set("trips", "key2", [50, 100]);
                        flushTime();
                    });
                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should add data to correct node", function() {
                        expect(subject.path()).toEqual(rootPath + "/geofire/trips");
                        expect(subject.ref().getData()).toEqual({
                            key: {
                                g: jasmine.any(String),
                                l: [90, 100]
                            },
                            key2: {
                                g: jasmine.any(String),
                                l: [50, 100]
                            }
                        });
                    });
                });
                describe("remove", function() {
                    beforeEach(function() {
                        subject.set("trips", "key", [90, 100]);
                        subject.set("trips", "key2", [50, 100]);
                        flushTime();
                        test = subject.remove("trips", "key");
                        flushTime();
                    });
                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should remove the record", function() {
                        expect(subject.path()).toEqual(rootPath + "/geofire/trips");
                        expect(subject.ref().getData()).toEqual({
                            key2: {
                                g: jasmine.any(String),
                                l: [50, 100]
                            }
                        });
                    });
                });
                describe("get", function() {
                    beforeEach(function() {
                        subject.set("trips", "key", [90, 100]);
                        subject.set("trips", "key2", [50, 100]);
                        flushTime();
                        test = subject.get("trips", "key");
                        $rootScope.$digest();
                        $timeout.flush();
                    });
                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should retrieve the correct record", function() {
                        expect(subject.path()).toEqual(rootPath + "/geofire/trips");
                    });
                });
                describe("query", function() {
                    beforeEach(function() {
                        subject.set("trips", "key2", [50, 100]);
                        flushTime();
                        extendMockFb(subject.ref());
                        test = subject.query("trips", {
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
                        expect(subject.path()).toEqual(rootPath + "/geofire/trips");
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
            });
            describe("Main Location Array", function() {
                beforeEach(function() {
                    options = {
                        geofire: true
                    };
                    subject = fuel("locations", options);
                });
                describe("addLoc", function() {
                    beforeEach(function() {
                        test = subject.addLoc("trips", locData[0], true);
                        flush();
                        this.key = subject.ref().key();
                        test1 = subject.addLoc("trips", locData[1], true);
                        flush();
                        this.key1 = subject.ref().key();
                    });
                    useParentRef();
                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                        expect(test1).toBeAPromise();
                    });
                    it("should return correct ref", function() {
                        expect(getPromValue(test).path).toEqual(rootPath + "/locations/trips/" + this.key);
                        expect(subject.path()).toEqual(rootPath + "/locations/trips/" + this.key1);
                    });
                    it("should remove coordinate data", function() {
                        expect(getPromValue(test).getData()).toBeDefined();
                        expect(getPromValue(test).getData().lat).not.toBeDefined();
                        expect(getPromValue(test).getData().lat).not.toBeDefined();

                    });
                    it("should add the data to firebase", function() {
                        expect(getPromValue(test).getData()).toEqual(locData[0]);
                        expect(getPromValue(test1).getData()).toEqual(locData[1]);
                    });
                    qReject(0);
                });
                describe("removeLoc", function() {
                    beforeEach(function() {
                        $rootScope.$digest();
                        subject.ref().child("locations/trips").push(locData[0]);
                        subject.ref().child("locations/trips").push(locData[1]);
                        subject.ref().flush();
                        this.keys = Object.keys(subject.ref().child("locations/trips").children);
                        test = subject.removeLoc("trips", this.keys[0]);
                        flush();
                    });
                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should return correct ref", function() {
                        expect(subject.path()).toEqual(rootPath + "/locations/trips/" + this.keys[0]);
                    });
                    it("should remove the data to firebase", function() {
                        expect(getPromValue(test).getData()).toEqual(null);
                        expect(subject.ref().getData()).toEqual(null);
                    });
                    qReject(0);
                });
            });
        });

        describe("Nested Arrays", function() {
            beforeEach(function() {
                test = null;
                this.data = {
                    name: "frank",
                    age: 30,
                    city: "Boston"
                };
                this.newPhone = [{
                    number: "123456",
                    type: "cell",
                    valid: true
                }, {
                    number: "098765",
                    type: "rotary",
                    valid: false
                }];
                subject = fuel("users", {
                    nestedArrays: ["phones", "emails"],
                    session: true,
                });
                $rootScope.$digest();
                subject.add(this.data);
                flush();
                this.userId = subject.ref().key();
                spyOn(session, "getId").and.returnValue(this.userId);
            });
            afterEach(function() {
                test = null;
            });

            var methods = ["addPhone", "removePhone", "loadPhone", "savePhone", "getPhone", "loadPhones", "phone", "phones"];

            function nestedArr(x) {
                it(x + " should be defined", function() {
                    expect(subject[x]).toBeDefined();
                });
            }
            methods.forEach(nestedArr);
            it("simple checks on setup", function() {
                expect(subject.ref().getData()).toEqual({
                    name: "frank",
                    age: 30,
                    city: "Boston"
                });
                expect(this.userId).not.toEqual("users");
                expect(this.userId).toEqual(jasmine.any(String));
            });
            describe("Queries", function() {
                beforeEach(function() {
                    subject.ref().child("phones").push(this.newPhone[0])
                    subject.ref().flush();
                    subject.ref().child("phones").push(this.newPhone[1])
                    subject.ref().flush();
                });
                describe("nestedArray method", function() {
                    beforeEach(function() {
                        test = subject.phones();
                        flush();
                        this.key1 = childKeys()[0];
                        this.key2 = childKeys()[1];
                    });
                    it("should add sessionId() if available as mainRecId", function() {
                        expect(subject.path().search(this.userId)).not.toEqual(-1);
                    });
                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should resolve to a firebaseArray", function() {
                        baseCheck("array", getPromValue(test));
                    });
                    it("should have correct path", function() {
                        expect(getPromValue(test).$ref().toString()).toEqual(rootPath + "/users/" + this.userId + "/phones");
                    });
                    it("should update the currentRef", function() {
                        expect(childKeys()).toEqual([this.key1, this.key2]);
                    });
                    it("should have correct length", function() {
                        expect(getPromValue(test).length).toEqual(2);
                    });
                    qReject(0);
                });
                describe("nestedRecord method", function() {
                    beforeEach(function() {
                        test = subject.phone(1);
                        flush();
                        this.id = subject.ref().key();
                    });

                    it("should throw error if no recId is provided", function() {
                        expect(function() {
                            subject.phone();
                            flush();
                        }).toThrow();
                    });
                    it("should return a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should resolve to a firebaseObject", function() {
                        expect(getPromValue(test)).toEqual(jasmine.objectContaining({
                            $id: this.id,
                            $priority: null,
                            $ref: jasmine.any(Function)
                        }))
                        expect(this.id).toEqual('1');
                    });

                    it("should have correct path", function() {
                        expect(getPromValue(test).$ref().toString()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + this.id);
                    });
                    it("should update the currentRef", function() {
                        expect(subject.path()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + this.id);
                        expect(this.id).not.toEqual("phones");

                    });
                    it("parent array should be correct length", function() {
                        expect(dataKeys(getPromValue(test).$ref().parent()).length).toEqual(2);
                    });
                    qReject(0);
                });

                describe("getPhone", function() {
                    beforeEach(function() {

                        this.key1 = childKeys("phones")[0];
                        this.key2 = childKeys("phones")[1];
                        test = subject.getPhone(this.key1);
                        //if use flush() then getRecord wont find key;
                        flushAll(subject.ref());
                    });
                    it("should return a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should resolve to correct firebaseObject", function() {
                        expect(getPromValue(test)).toEqual(jasmine.objectContaining({
                            $id: this.key1,
                            $priority: null,
                            number: "123456",
                            type: "cell",
                            valid: true
                        }))
                        expect(this.key1).not.toEqual(this.key2);
                    });
                    it("should have correct key", function() {
                        expect(getPromValue(test).$id).toEqual(this.key1);
                    });
                    it("should update currentRef to parentRef", function() {
                        expect(subject.ref().key()).toEqual("phones");
                        expect(childKeys()[0]).toEqual(this.key1);
                    });
                    it("parent array should be correct length", function() {
                        expect(childKeys().length).toEqual(2);
                    });
                    logContains("setting ref to current parent");
                    qReject(0);
                });
                describe("loadPhone", function() {
                    beforeEach(function() {
                        this.key1 = childKeys("phones")[0];
                        this.key2 = childKeys("phones")[1];
                        test = subject.loadPhone(this.key1);
                        // flushAll(subject.ref());
                        //flush works here: think the issue is the order of tasks and $indexFor()
                        flush();
                        this.refKey = getPromValue(test).$id;
                    });
                    it("should return a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should resolve to a firebaseObject", function() {
                        expect(getPromValue(test)).toEqual(jasmine.objectContaining({
                            $id: this.key1,
                            $priority: null,
                            number: "123456",
                            type: "cell",
                            valid: true
                        }))
                        expect(this.key1).not.toEqual(this.key2);
                    });
                    it("should have correct key", function() {
                        expect(subject.ref().key()).toEqual(this.key1);
                        expect(this.refKey).toEqual(this.key1);
                    });
                    it("parent array should be correct length", function() {
                        expect(dataKeys(subject.parent()).length).toEqual(2);
                    });
                    qReject(0);
                    logContains("setting ref to current object ref");
                });
                describe("loadPhones", function() {
                    beforeEach(function() {
                        this.key1 = childKeys("phones")[0];
                        this.key2 = childKeys("phones")[1];
                        test = subject.loadPhones();
                        flushAll(subject.ref());
                        this.refKeys = getPromValue(test).$ref().getKeys();
                    });
                    it("should return a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should resolve to a firebaseArray", function() {
                        expect(getPromValue(test)).toEqual(jasmine.objectContaining({
                            $add: jasmine.any(Function),
                            $getRecord: jasmine.any(Function),
                            $ref: jasmine.any(Function)
                        }));
                        expect(this.key1).not.toEqual(this.key2);
                    });
                    it("should have correct length", function() {
                        expect(getPromValue(test).length).toEqual(2);
                    });
                    it("should have correct records", function() {
                        expect(getPromValue(test)[0]).toEqual(jasmine.objectContaining(this.newPhone[0]));
                        expect(getPromValue(test)[1]).toEqual(jasmine.objectContaining(this.newPhone[1]));
                    });
                    it("should have correct keys", function() {
                        expect(this.refKeys[0]).toEqual(this.key1);
                        expect(this.refKeys[1]).toEqual(this.key2);

                    });
                    it("should update the current ref", function() {
                        expect(subject.ref().getKeys()[0]).toEqual(this.key1);
                        expect(subject.ref().getData()[this.key1]).toEqual(this.newPhone[0]);
                        expect(subject.ref().getKeys()[1]).toEqual(this.key2);
                        expect(subject.ref().getData()[this.key2]).toEqual(this.newPhone[1]);
                    });
                    qReject(0);
                    logContains("setting ref to current object ref");
                });
            });
            describe("Commands", function() {
                beforeEach(function() {
                    test = subject.addPhone(this.newPhone[0]);
                    flush();
                    this.key = subject.ref().key();
                });
                describe("add()", function() {
                    it("should add a record to the correct array", function() {
                        expect(subject.ref().getData()).toEqual(this.newPhone[0]);
                    });
                    it("should have correct path", function() {
                        expect(getPromValue(test).toString()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + this.key);
                    });
                    it("should update the currentRef", function() {
                        expect(subject.path()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + this.key);
                    });
                    it("should resolve to a fireBaseRef", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                    });
                    qReject(0);
                });
                describe("remove()", function() {
                    beforeEach(function() {
                        test = subject.removePhone(this.key);
                        flush();
                        this.key1 = subject.ref().key();
                    });
                    it("should remove the record to the correct array", function() {
                        expect(subject.ref().getData()).toEqual(null);
                    });
                    it("should have correct path", function() {
                        expect(this.key1).toEqual(this.key);
                        expect(getPromValue(test).toString()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + this.key1);
                    });
                    it("should update the currentRef", function() {
                        expect(this.key1).toEqual(this.key);
                        expect(subject.path()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + this.key1);
                    });
                    it("should resolve to a fireBaseRef", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                    });
                    qReject(0);
                });
                describe("save()", function() {
                    beforeEach(function() {
                        subject.base()[0].type = "landLine";
                        subject.base()[0].number = "11223344";
                        test = subject.savePhone([subject.base(), this.key]);
                        flush();
                        this.key1 = subject.ref().key();
                    });
                    it("should have correct path", function() {
                        expect(this.key1).toEqual(this.key);
                        expect(getPromValue(test).toString()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + this.key1);
                    });
                    it("should update the currentRef", function() {
                        expect(this.key1).toEqual(this.key);
                        expect(subject.path()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + this.key1);
                    });
                    it("should update record", function() {
                        expect(subject.ref().getData().type).toEqual("landLine");
                        expect(subject.ref().getData().number).toEqual("11223344");
                    });
                    it("should resolve to a fireBaseRef", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                    });
                    qReject(0);
                })
            });
        });




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
