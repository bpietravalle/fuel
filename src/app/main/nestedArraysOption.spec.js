(function() {
    "use strict";

    describe("Nested Arrays", function() {
        var key1, pm, testRef, key2, keyMock, $timeout, session, rootPath, utils, test, ref, $rootScope, fuel, subject, fireStarter, $q, $log;

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
                    //just making sure nested array methods dont confuse
                    //injected services
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


            inject(function(_utils_, _$timeout_, _$log_, _session_, _$rootScope_, _fuel_, _fireStarter_, _$q_) {
                utils = _utils_;
                $timeout = _$timeout_;
                session = _session_;
                $rootScope = _$rootScope_;
                fuel = _fuel_;
                fireStarter = _fireStarter_;
                $q = _$q_;
                $log = _$log_;
            });

            spyOn($q, "reject").and.callThrough();
            spyOn($log, "info").and.callThrough();

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
                timeStamp: false
            });
            $rootScope.$digest();
            subject.add(this.data);
            flushTime();
            this.userId = subject.ref()._lastAutoId;
            spyOn(session, "getId").and.returnValue(this.userId);
            spyOn(utils, "pluralize").and.callThrough();
            spyOn(utils, "singularize").and.callThrough();
            spyOn(utils, "camelize").and.callThrough();
        });
        afterEach(function() {
            subject = null;
            fireStarter = null;
            fuel = null;
        });

        var methods = ["addPhone", "removePhone", "loadPhone", "savePhone", "getPhone", "loadPhones", "phone", "phones"];

        function nestedArr(x) {
            it(x + " should be defined", function() {
                expect(subject[x]).toBeDefined();
            });
        }
        methods.forEach(nestedArr);
        it("simple checks on setup", function() {
            expect(subject.ref().getData()[this.userId]).toEqual({
                name: "frank",
                age: 30,
                city: "Boston"
            });
        });
        describe("Queries", function() {
            beforeEach(function() {
                subject.ref().child(this.userId).child("phones").push(this.newPhone[0])
                subject.ref().flush();
                subject.ref().child(this.userId).child("phones").push(this.newPhone[1])
                subject.ref().flush();
                testRef = subject.ref().child(this.userId);
                key1 = childKeys(testRef, 'phones')[0];
                key2 = childKeys(testRef, 'phones')[1];
            });
            describe("nestedArray method", function() {
                beforeEach(function() {
                    test = subject.phones();
                    $rootScope.$digest();
                    $timeout.flush();
                });
                // utilsSpy('pluralize');
                it("should be a promise", function() {
                    expect(test).toBeAPromise();
                });
                it("should add sessionId() if available as mainRecId", function() {
                    var str = getPromValue(test).$ref().toString();
                    expect(str.search(this.userId)).not.toEqual(-1);
                });
                it("should resolve to a firebaseArray", function() {
                    baseCheck("array", getPromValue(test));
                });
                it("should have correct path", function() {
                    expect(getPromValue(test).$ref().toString()).toEqual(rootPath + "/users/" + this.userId + "/phones");
                });
                qReject(0);
            });
            describe("nestedRecord method", function() {
                beforeEach(function() {
                    test = subject.phone(1);
                    flushTime();
                    this.id = subject.ref().key();
                });
                it("should throw error if no recId is provided", function() {
                    expect(function() {
                        subject.phone();
                        flushTime();
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
                qReject(0);
            });

            describe("getPhone", function() {
                beforeEach(function() {
                    pm = subject.inspect('pathMaster');
                    testRef = testRef.child('phones');
                    spyOn(pm, 'nestedArray').and.returnValue(fs('array', testRef.autoFlush(true)));
                    test = subject.getPhone(key1);
                    $rootScope.$digest();
                    $timeout.flush();
                });
                it("should return a promise", function() {
                    expect(test).toBeAPromise();
                });
                it("should resolve to correct record", function() {
                    expect(getPromValue(test)).toEqual(jasmine.objectContaining({
                        $id: key1,
                        $priority: null,
                        number: "123456",
                        type: "cell",
                        valid: true
                    }))
                });
                it("should have correct key", function() {
                    expect(getPromValue(test).$id).toEqual(key1);
                });
                qReject(0);
            });
            describe("loadPhone", function() {
                beforeEach(function() {
                    pm = subject.inspect('pathMaster');
                    testRef = testRef.child('phones').child(key1);
                    spyOn(pm, 'nestedRecord').and.returnValue(fs('object', testRef.autoFlush(true)));
                    test = subject.loadPhone(key1);
                    $rootScope.$digest();
                    $timeout.flush();
                });
                it("should return a promise", function() {
                    expect(test).toBeAPromise();
                });
                it("should resolve to a firebaseObject", function() {
                    expect(getPromValue(test)).toEqual(jasmine.objectContaining({
                        $id: key1,
                        $priority: null,
                        number: "123456",
                        type: "cell",
                        valid: true
                    }))
                });
                it("should have correct path", function() {
                    expect(getPromValue(test).$ref().toString()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + key1);
                });
                qReject(0);
            });
            describe("loadPhones", function() {
                beforeEach(function() {
                    pm = subject.inspect('pathMaster');
                    testRef = testRef.child('phones');
                    spyOn(pm, 'nestedArray').and.returnValue(fs('array', testRef.autoFlush(true)));
                    test = subject.loadPhones();
                    $rootScope.$digest();
                    $timeout.flush();
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
                });
                it("should have correct length", function() {
                    expect(getPromValue(test).length).toEqual(2);
                });
                it("should have correct records", function() {
                    expect(getPromValue(test)[0]).toEqual(jasmine.objectContaining(this.newPhone[0]));
                    expect(getPromValue(test)[1]).toEqual(jasmine.objectContaining(this.newPhone[1]));
                });
                it("should have correct keys", function() {
                    expect(this.refKeys[0]).toEqual(key1);
                    expect(this.refKeys[1]).toEqual(key2);
                });
                qReject(0);
            });
        });
        describe("Commands", function() {
            beforeEach(function() {
                test = subject.addPhone(this.newPhone[0]);
                flushTime();
                testRef = subject.ref();
                key1 = testRef._lastAutoId;
            });
            describe("add()", function() {
                it("should add a record to the correct array", function() {
                    expect(getPromValue(test).getData()).toEqual(this.newPhone[0]);
                });
                it("should have correct path", function() {

                    expect(getPromValue(test).toString()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + key1);
                });
                it("should resolve to a fireBaseRef", function() {
                    expect(getPromValue(test)).toBeAFirebaseRef();
                });
                qReject(0);
            });
            describe("remove()", function() {
                beforeEach(function() {
                    pm = subject.inspect('pathMaster');
                    testRef = testRef.child(key1);
                    spyOn(pm, 'nestedRecord').and.returnValue(fs('object', testRef.autoFlush(true)));
                    test = subject.removePhone(key1);
                    $rootScope.$digest();
                    $timeout.flush();
                });
                it("should remove the record to the correct array", function() {
                    expect(getPromValue(test).getData()).toEqual(null);
                });
                it("should have correct path", function() {
                    expect(getPromValue(test).toString()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + key1);
                });
                it("should resolve to a fireBaseRef", function() {
                    expect(getPromValue(test)).toBeAFirebaseRef();
                });
                qReject(0);
            });
            describe("save()", function() {
                describe("When argument is an array", function() {
                    beforeEach(function() {
                        subject.base()[0].type = "landline";
                        subject.base()[0].number = "11223344";
                        test = subject.savePhone([subject.base(), subject.base()[0]]);
                        $rootScope.$digest();
                        $timeout.flush();
                        subject.ref().flush();
                        $rootScope.$digest();
                    });
                    it("should have correct path in return value", function() {

                        expect(getPromValue(test).toString()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + key1);
                    });
                    it("should update record", function() {
                        expect(getPromValue(test).getData().type).toEqual("landline");
                        expect(getPromValue(test).getData().number).toEqual("11223344");
                    });
                    it("should resolve to a fireBaseRef", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                    });
                    qReject(0);
                });
                describe("when argument is a record", function() {
                    beforeEach(function() {
                        subject.base()[0].type = "landline";
                        subject.base()[0].number = "11223344";
                        pm = subject.inspect('pathMaster');
                        testRef = subject.base();
                        testRef.$ref().autoFlush(true);
                        key1 = testRef[0].$id;
                        spyOn(pm, 'nestedArray').and.returnValue(testRef);
                        test = subject.savePhone(testRef[0]);
                        $rootScope.$digest();
                        $timeout.flush();
                    });
                    it("should have correct path in return value", function() {
                        expect(getPromValue(test).toString()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + key1);
                    });
                    it("should update record", function() {
                        expect(getPromValue(test).getData().type).toEqual("landline");
                        expect(getPromValue(test).getData().number).toEqual("11223344");
                    });
                    it("should resolve to a fireBaseRef", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                    });
                    qReject(0);

                });
            })
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





        function childKeys(ref, node) {
            if (!node) {
                return Object.keys(ref.children);
            } else {
                return Object.keys(ref.child(node).getData());
            }
        }


        function fs(type, ref) {
            return $q.when(fireStarter(type, ref, true));
        }

        function flushTime() {
            $rootScope.$digest();
            $timeout.flush();
            subject.ref().flush();
            $rootScope.$digest();
        }




    });


})();
