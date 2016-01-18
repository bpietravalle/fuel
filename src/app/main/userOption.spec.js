(function() {
    "use strict";

    describe("Fuel Factory", function() {
        var differentSession, keyMock, $timeout, arrData, newRecord, session, locData, test, ref, $rootScope, user, options, fuel, subject, $q, $log;

        beforeEach(function() {
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
            module("firebase.fuel", function($provide) {
                $provide.factory("location", function($q) {
                    var location = {
                        addLoc: keyMock("add", $q),
                        removeLoc: keyMock("remove", $q)

                    };

                    return location;

                })
                $provide.factory("differentLocation", function() {
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
                $provide.factory("geofire", function($q) {
                    var geofire = {
                        set: keyMock("set", $q),
                        remove: keyMock("remove", $q),
                        get: keyMock("get", $q)

                    };

                    return geofire;

                })
                $provide.factory("user", function($q) {
                    var user = {
                        addIndex: keyMock("addIndex", $q),
                        removeIndex: keyMock("removeIndex", $q),
                        getIndexKeys: function() {
                            return "spy";
                        }
                    };

                    return user;
                })
                $provide.factory("session", function() {
                    return {
                        getId: function() {}
                    }
                })
                $provide.factory("phone", function() {
                    return {
                        getId: function() {}
                    }
                })
                $provide.factory("phones", function() {
                    return {
                        getId: function() {}
                    }
                })
                $provide.factory("differentSession", function() {
                    return {
                        differentMeth: function() {}
                    }
                });
            });


            inject(function(_user_, _differentSession_, _$timeout_, _$log_, _session_, _$rootScope_, _fuel_, _$q_) {
                user = _user_
                differentSession = _differentSession_;
                $timeout = _$timeout_;
                session = _session_;
                $rootScope = _$rootScope_;
                fuel = _fuel_;
                $q = _$q_;
                $log = _$log_;
            });

            spyOn($q, "reject").and.callThrough();
            spyOn($log, "info").and.callThrough();
            spyOn(session, "getId").and.returnValue('1');
        });
        afterEach(function() {
            subject = null;
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
                    it("should add the sessionId correctly", function() {
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
                describe("Current", function() {
                    beforeEach(function() {
                        subject = fuel("users", {
                            session: true
                        });
                        test = subject.session();
                    });
                    it("should return the session Object", function() {
											var ses = subject.inspect('sessionObject');
                        expect(test).toEqual(ses);
                    });
                });
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
                                $id: '1', //this.key,
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



        function getPromValue(obj) {
            return obj.$$state.value;
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

        function flushTime() {
            $rootScope.$digest();
            $timeout.flush();
            subject.ref().flush();
            $rootScope.$digest();
        }


    });


})();
