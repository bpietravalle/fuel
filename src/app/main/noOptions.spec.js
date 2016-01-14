(function() {
    "use strict";

    describe("No Options", function() {
        var id, keyMock, $timeout, arrData, newRecord, rootPath, test, ref, $rootScope, options, fuel, subject, $q, $log;

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

            newRecord = {
                phone: "111222333",
                firstName: "sally"
            };
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

                });
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
                });
                //just making sure nested array methods dont confuse
                //injected services
                $provide.factory("phone", function() {
                    return {
                        getId: function() {}
                    }
                });
                $provide.factory("phones", function() {
                    return {
                        getId: function() {}
                    }
                });
                $provide.factory("differentSession", function() {
                    return {
                        differentMeth: function() {}
                    }
                });
            });


            inject(function(_$timeout_, _$log_, _$rootScope_, _fuel_, _$q_) {
                $timeout = _$timeout_;
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

        describe("Without Options", function() {
            beforeEach(function() {
                options = {};
                subject = fuel("trips", options);
            });
            describe("commands", function() {
                describe("add", function() {
                    beforeEach(function() {
                        test = subject.add(newRecord);
                        $timeout.flush();
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
                    it("should save the data to firebaseRef", function() {
                        expect(getPromValue(test).getData()).toEqual(newRecord);
                    });
                });
                describe("Saving Array Record", function() {
                    beforeEach(function() {
                        test = subject.add(newRecord);
                        $timeout.flush();
                        $rootScope.$digest();
                        subject.ref().flush();
                        $rootScope.$digest();
                        this.key = subject.ref().key();
                        $rootScope.$digest();
                        subject.ref().set(arrData);
                        $rootScope.$digest();
                        this.name = subject.base()[0].firstName;
                        this.id = subject.base()[0].$id;
                        subject.base()[0].firstName = "john jacob";
                        $rootScope.$digest();
                    });
                    afterEach(function() {
                        this.name = null;
                        this.phone = null;
                    });
                    describe("If second arg is the record", function() {
                        beforeEach(function() {
                            test = subject.save([subject.base(), subject.base()[0]]);
                            $rootScope.$digest();
                            $timeout.flush();
                            subject.ref().flush();
                            $rootScope.$digest();
                        });
                        it("should save record if pass an arrary with [fireBaseArray, record]", function() {
                            expect(this.name).toEqual('sally');
                            expect(getPromValue(test).getData().firstName).toEqual("john jacob");
                        });
                        it("should return a promise", function() {
                            expect(test).toBeAPromise();
                        });
                        it("should resolve to the correct firebaseRef", function() {

                            expect(getPromValue(test)).toBeAFirebaseRef();
                            expect(getPromValue(test).path).toEqual(rootPath + "/trips/" + this.id);
                        });
                        qReject(0);
                    });
                    describe("If second arg is the record's index", function() {
                        beforeEach(function() {
                            test = subject.save([subject.base(), 0]);
                            $rootScope.$digest();
                            $timeout.flush();
                            subject.ref().flush();
                            $rootScope.$digest();
                        });
                        it("should save record ", function() {
                            expect(this.name).toEqual('sally');
                            expect(getPromValue(test).getData().firstName).toEqual("john jacob");
                        });
                        it("should return a promise", function() {
                            expect(test).toBeAPromise();
                        });
                        it("should resolve to the correct firebaseRef", function() {
                            expect(getPromValue(test)).toBeAFirebaseRef();
                            expect(getPromValue(test).path).toEqual(rootPath + "/trips/" + this.id);
                        });
                        qReject(0);
                    });
                    describe("If second arg is the record's key", function() {
                        beforeEach(function() {
                            test = subject.save([subject.base(), this.id]);
                            $rootScope.$digest();
                            $timeout.flush();
                            subject.ref().flush();
                            $rootScope.$digest();
                        });
                        it("should save record correctly", function() {
                            expect(this.name).toEqual('sally');
                            expect(getPromValue(test).getData().firstName).toEqual("john jacob");
                        });
                        it("should return a promise", function() {
                            expect(test).toBeAPromise();
                        });
                        it("should resolve to the correct firebaseRef", function() {
                            expect(getPromValue(test)).toBeAFirebaseRef();
                            expect(getPromValue(test).path).toEqual(rootPath + "/trips/" + this.id);
                        });
                        qReject(0);
                    });
                });
                describe("Saving Object", function() {
                    beforeEach(function() {
                        // subject.base()[0].firstName = "john jacob";
                        subject.load("uniqueKey");
                        $rootScope.$digest();
                        $timeout.flush();
                        subject.ref().flush();
                        $rootScope.$digest();
                        this.id = subject.base().$id
                        subject.base().name = "sally";
                        test = subject.save(subject.base());
                        $rootScope.$digest();
                        subject.ref().flush();
                        $rootScope.$digest();
                    });
                    it("should save record", function() {
                        expect(this.id).toEqual('uniqueKey');
                        expect(getPromValue(test).getData().name).toEqual("sally");
                    });
                    it("should return a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should resolve to the correct firebaseRef", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                        expect(getPromValue(test).path).toEqual(rootPath + "/trips/" + this.id);
                    });
                    it("should change the ref() to the saved record's ref", function() {
                        expect(subject.path()).toEqual("https://your-firebase.firebaseio.com/trips/" + this.id);
                    });
                    qReject(0);
                });
                describe("Indices", function() {
                    beforeEach(function() {
                        test = subject.addIndex("1", "hotels", "string");
                        $rootScope.$digest();
                        $timeout.flush();
                        $rootScope.$digest();
                        subject.ref().flush();
                        $rootScope.$digest();
                        this.idx = subject.ref();
                    });
                    describe("addIndex", function() {
                        it("should be a promise", function() {
                            expect(test).toBeAPromise();
                        });
                        it("should set ref to user Index", function() {
                            expect(subject.path()).toEqual(rootPath + "/trips/1/hotels");
                        });
                        it("should add data to index", function() {
                            expect(this.idx.getData()).toEqual({
                                "string": true
                            });
                        });
                        it("should return the firebaseRef of the records index", function() {
                            expect(getPromValue(test)).toBeAFirebaseRef();
                            expect(getPromValue(test).path).toEqual(subject.path());
                        });
                        qReject(0);
                    });
                    describe("removeIndex", function() {
                        beforeEach(function() {
                            test = subject.removeIndex("1", "hotels", "string");
                            flushTime();
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
                });
                describe("removeMainRecord", function() {
                    beforeEach(function() {
                        $rootScope.$digest();
                        subject.ref().push(arrData);
                        subject.ref().flush();
                        id = subject.ref()._lastAutoId;
                        $rootScope.$digest();
                        test = subject.remove(id);
                        flushTime();
                    });
                    it("should remove the record and return a firebaseRef", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                        expect(getPromValue(test).getData()).toEqual(null);
                        expect(getPromValue(test).path).toEqual("https://your-firebase.firebaseio.com/trips/" + id);
                    });
                    it("should change the ref() to the removed record's ref", function() {
                        expect(subject.path()).toEqual("https://your-firebase.firebaseio.com/trips/" + id);
                    });
                    qReject(0);
                });
                describe("bindTo", function() {
                    beforeEach(function() {
                        subject.add(arrData[0]);
                        flushTime();
                        this.key = subject.ref().key();
                        this.scope = $rootScope.$new()
                    });
                    afterEach(function() {
                        this.scope = null;
                    });
                    describe("with passing key", function() {
                        beforeEach(function() {
                            test = subject.bindTo(this.key, this.scope, "testData");
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
                                $id: this.key,
                                $priority: null,
                                $value: null
                            });

                        });
                    });
                    describe("with passing a record", function() {
                        beforeEach(function() {
                            this.rec = subject.load(this.key);
                            flushTime();
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
                                $value: null
                                    // phone: "123456890",
                                    // uid: 1,
                                    // firstName: "tom"
                            });
                        });
                    });
                });
            });
            describe("Queries", function() {
                beforeEach(function() {
                    // subject.ref().push(arrData[0]);
                    // subject.ref().flush();
                    // this.key1 = subject.ref()._lastAutoId;
                    // subject.ref().push(arrData[1]);
                    // subject.ref().flush();
                    // this.key2 = subject.ref()._lastAutoId;
                    // this.keys = [this.key1, this.key2];
                });
                describe("load", function() {
                    describe("Without passing an argument", function() {
                        beforeEach(function() {
                            test = subject.load();
                            flushTime();
                            this.key = subject.base().$id;
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
                            expect(getPromValue(test)).toBeA('array');
                        });
                        it("should have length", function() {
                            expect(getPromValue(test)).toHaveLength(0);
                        });
                    });
                    describe("With passing an argument", function() {
                        beforeEach(function() {
                            test = subject.load("uniqueKey");
                            flushTime();
                        });
                        it("should return a promise", function() {
                            expect(test).toBeAPromise();
                        });
                        it("should return the correct object", function() {
                            expect(getPromValue(test).$id).toEqual("uniqueKey");
                            expect(getPromValue(test).$ref().getData()).toEqual(null);
                        });
                        it("should not be an array", function() {
                            expect(getPromValue(test)).not.toBeA('array');
                        });
                    });
                });
                describe("getRecord", function() {
                    beforeEach(function() {
                        // subject.ref().push(arrData[0]);
                        // subject.ref().push(arrData[1]);
                        // flush();
                        // this.ref = subject.ref();
                        // this.refKeys = dataKeys(this.ref);
                        test = subject.getRecord("uniqueKey");
                        $timeout.flush();
                        subject.ref().set({
                            "uniqueKey": {
                                "phone": "123456789"
                            }
                        });
                        subject.ref().flush();
                        $rootScope.$digest();
                    });
                    // it("should return correct record", function() {
                    //     expect(getPromValue(test).$id).toEqual("uniqueKey");
                    //     expect(getPromValue(test).phone).toEqual('123456789');
                    // });
                    it("should update the base() to the mainArray", function() {
                        baseCheck("array", subject.base());
                        expect(subject.base().$ref().key()).toEqual("trips");
                    });
                    qReject(0);
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


        function flushTime() {
            $rootScope.$digest();
            $timeout.flush();
            subject.ref().flush();
            $rootScope.$digest();
        }

    });


})();
