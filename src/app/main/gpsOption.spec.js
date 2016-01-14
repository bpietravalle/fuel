(function() {
    "use strict";

    describe("Fuel Factory", function() {
        var addArr, locRef, remArr, geofire, keyMock, $timeout, newRecord, rootPath, locData, test, $rootScope, user, options, fuel, subject, $q, $log;

        beforeEach(function() {
            addArr = [];
            remArr = [];
            rootPath = "https://your-firebase.firebaseio.com";
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
                    return q.when([mock]);
                });
            };
            module("firebase.fuel", function($provide) {
                $provide.factory("geofire", function($q) {
                    var geofire = {
                        add: jasmine.createSpy("add").and.callFake(function(args) {
                            locRef = new MockFirebase(rootPath).child("geofire");
                            return $q.all(args.map(function(arg) {
                                var l = locRef.push(arg);
                                l.flush();
                                addArr.push(l.key());
                                return l;
                            }));
                        }),
                        remove: jasmine.createSpy("remove").and.callFake(function(args) {
                            locRef = new MockFirebase(rootPath).child("geofire");
                            return $q.all(args.map(function(arg) {
                                var l = locRef.push(arg);
                                l.flush();
                                remArr.push(l.key());
                                return l;
                            }));
                        }),
                        addRecordKey: jasmine.createSpy("addRecordKey"),
                        loadRecordLocations: jasmine.createSpy("loadRecordLocations")
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
                $provide.factory("differentSession", function() {
                    return {
                        differentMeth: function() {}
                    }
                });
            });
            inject(function(_user_, _$timeout_, _geofire_, _$log_, _$rootScope_, _fuel_, _$q_) {
                $timeout = _$timeout_;
                geofire = _geofire_;
                user = _user_
                $rootScope = _$rootScope_;
                fuel = _fuel_;
                $q = _$q_;
                $log = _$log_;
            });

            spyOn($q, "all").and.callThrough();
            spyOn($q, "reject").and.callThrough();
            spyOn($log, "info").and.callThrough();
        });
        afterEach(function() {
            subject = null;
            fuel = null;
        });

        describe("With GPS Options", function() {
            beforeEach(function() {
                options = {
                    gps: true
                };
                subject = fuel("trips", options);
            });
            describe("Commands: ", function() {
							describe("setCoords",function(){
								beforeEach(function(){

								});

							});
                describe("add()", function() {
                    beforeEach(function() {
                        test = subject.add(newRecord, locData);
                        flushTime();
                        this.data = subject.ref().getData();
                        this.path = subject.path();
                        this.key = subject.ref().key();
                        this.key1 = addArr[0];
                        this.key2 = addArr[1];
                    });
                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should add record to main array", function() {
												flushTime();
                        var ref = getPromValue(test)
                        expect(ref.getData()).toEqual(jasmine.objectContaining(newRecord));
                    });
                    it("should not add uid property to main record", function() {
												flushTime();
                        var ref = getPromValue(test)
                        expect(ref.getData().uid).not.toBeDefined();
                        expect(ref.getData()).toBeDefined();
                    });
                    it("should not call user.addIndex", function() {
                        expect(user.addIndex).not.toHaveBeenCalled();
                    });
                    it("should call geofire.add once", function() {
                        expect(geofire.add.calls.count()).toEqual(1);
                    });
                    it("should call geofire.add with correct path argument", function() {
                        expect(geofire.add.calls.argsFor(0)[2]).toEqual("trips");
                    });
                    it("should call geofire.addRecordKey for each location added", function() {
                        expect(geofire.addRecordKey.calls.count()).toEqual(2);
                    });
                    it("should call geofire.addRecordKey with correct args", function() {
												flushTime();
                        var id = getPromValue(test).key();
                        expect(geofire.addRecordKey.calls.argsFor(0)[0]).toEqual("trips");
                        expect(geofire.addRecordKey.calls.argsFor(0)[1]).toEqual(this.key1);
                        expect(geofire.addRecordKey.calls.argsFor(0)[2]).toEqual(id);
                        expect(geofire.addRecordKey.calls.argsFor(1)[0]).toEqual("trips");
                        expect(geofire.addRecordKey.calls.argsFor(1)[1]).toEqual(this.key2);
                        expect(geofire.addRecordKey.calls.argsFor(1)[2]).toEqual(id);
                    });
                    it("should add location index to main record and set ref to main record", function() {
                        $rootScope.$digest();
                        $timeout.flush();
                        $rootScope.$digest();
                        expect(addArr).toHaveLength(2);
                    });
                    qReject(0);
                });
                describe("add() If addRecordKey option set to false", function() {
                    beforeEach(function() {
                        subject = fuel("trips", {
                            gps: true,
                            addRecordKey: false
                        });
                        test = subject.add(newRecord, locData);
                        flushTime();
                    });
                    it("should not call geofire.addRecordKey", function() {
                        expect(geofire.addRecordKey.calls.count()).toEqual(0);
                    });
                    it("should call geofire.add", function() {
                        expect(geofire.add.calls.count()).toEqual(1);
                    });
                });
                describe("remove()", function() {
                    beforeEach(function() {
                        // this.idxKey = Object.keys(subject.ref().child("locations").getData());
                        test = subject.remove("key");
                        flushTime();
                        flushTime();
                    });
                    it("should call geofire.remove() once", function() {
                        expect(geofire.remove.calls.count()).toEqual(1);
                    });
                    it("should call remove on geofire with keys from location index", function() {
                        expect(geofire.remove.calls.argsFor(0)[0]).toEqual(addArr);
                    });
                    it("should call geofire.remove with correct path argument", function() {
                        expect(geofire.remove.calls.argsFor(0)[2]).toEqual("trips");
                    });
                    it("should remove the data from firebase", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                        expect(getPromValue(test).getData()).toEqual(null); //it was null to begin with...
                    });
                    it("should return the firebaseRef from the removed record", function() {
                        expect(subject.path()).toEqual(rootPath + "/trips/key");
                    });
                    it("should not call user.removeIndex()", function() {
                        expect(user.removeIndex).not.toHaveBeenCalled();
                    });
                    qReject(0);
                });
            });
            describe("Queries: ", function() {
                describe("loadRecordLocations", function() {
                    beforeEach(function() {
                        extend(subject.ref());

                        test = subject.loadRecordLocations("tripId", "uniqueKey");
                    });
                    it("should send property and key to geofireObject", function() {
                        expect(geofire.loadRecordLocations).toHaveBeenCalledWith("tripId", "uniqueKey");
                    });
                });
            });
        });

        function getPromValue(obj) {
            return obj.$$state.value;
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



        function extend(obj) {
            var extension = {
                orderByChild: function() {
                    return {
                        startAt: function() {
                            return {
                                endAt: function() {
                                    return {
                                        on: function() {}
                                    }

                                }
                            }
                        }
                    }
                }
            };
            return _.merge(obj, extension);
        }


        function flushTime() {
            $rootScope.$digest();
            $timeout.flush();
            subject.ref().flush();
            $rootScope.$digest();
        }
    });


})();
