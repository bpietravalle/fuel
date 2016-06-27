(function() {
    "use strict";

    describe("GPS & User Options", function() {
        var addArr, locRef, remArr, geofire, keyMock, $timeout, newRecord, session, rootPath, locData, test, ref, $rootScope, user, options, fuel, subject, $q, $log;

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
                    return q.when(mock);
                });
            };
            // .config(function(fuelConfigurationProvider) {
            //     fuelConfigurationProvider.setRoot(rootPath);
            // })
            module("testutils");
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
                        addRecordKey: jasmine.createSpy("addRecordKey")
                    };

                    return geofire;
                })
                $provide.factory("differentLocation", function($q) {
                    var location = {
                        add: jasmine.createSpy("add").and.callFake(function(data, s, flag) {
                            if (flag === true) {
                                delete data.lat;
                                delete data.lon;
                            }

                            ref = new MockFirebase("locations");

                            ref.push(data);
                            ref.flush();
                            var key = ref._lastAutoId;
                            remArr.push(key);
                            return $q.when(ref.child(key));
                        })

                    };

                    return location;
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
                $provide.factory("differentSession", function() {
                    return {
                        differentMeth: function() {}
                    }
                });
            });


            inject(function(_user_, _session_, _geofire_, _$timeout_, _$log_, _$rootScope_, _fuel_, _$q_) {
                geofire = _geofire_;
								user = _user_;
								session = _session_;
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
                    it("should add uid property to main record", function() {
												flushTime();
                        var ref = getPromValue(test)
                        expect(ref.getData().uid).toEqual(1);
                    });
                    it("should call user.addIndex with correct path and main record key", function() {
												flushTime();
                        var id = getPromValue(test).key();
                        expect(user.addIndex).toHaveBeenCalledWith(null, "trips", id);
                    });
                    it("should call geofire.add once", function() {
                        expect(geofire.add.calls.count()).toEqual(1);
                    });
                    it("should call geofire.add with correct path argument", function() {
                        expect(geofire.add.calls.argsFor(0)[1]).toEqual("trips");
                    });
                    it("should add records to main location array", function() {
                        expect(geofire.add.calls.argsFor(0)[0]).toEqual(locData);
                    });
                    it("should call pass new mainRecord key to geofire.add", function() {
                        var key = Object.keys(this.data)[0];
                        expect(geofire.add.calls.argsFor(0)[2]).toEqual(key);
                    });
                    it("should add location indices to main record and set ref to main record", function() {
												flushTime();
                        var path = getPromValue(test);
                        expect(path.toString()).toEqual(rootPath + "/trips/" + path.key());
                    });
                    qReject(0);
                });
                describe("remove()", function() {
                    beforeEach(function() {
                        // this.idxKeys = Object.keys(subject.ref().child("locations").getData());
                        test = subject.remove("key");
                        flushTime();
                        flushTime();
                    });
                    it("should call geofire.remove() once", function() {
                        expect(geofire.remove.calls.count()).toEqual(1);
                    });
                    it("should call geofire.remove with correct path argument", function() {
                        expect(geofire.remove.calls.argsFor(0)[2]).toEqual("trips");
                    });
                    it("should call remove on geofire with keys from main location index", function() {
                        expect(geofire.remove.calls.argsFor(0)[0]).toEqual(addArr);
                    });
                    it("should remove the data from firebase", function() {
                        expect(subject.ref().getData()).toEqual(null);
                    });
                    it("should return the firebaseRef from the removed record", function() {
                        expect(subject.path()).toEqual(rootPath + "/trips/key");
                    });
                    it("should call user.removeIndex() with correct key", function() {
                        expect(user.removeIndex).toHaveBeenCalledWith(null, 'trips', "key");
                    });
                    qReject(0);
                });

            });
        });

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

        function getPromValue(obj) {
            return obj.$$state.value;
        }
        function flushTime() {
            $rootScope.$digest();
            $timeout.flush();
            subject.ref().flush();
            $rootScope.$digest();
        }

    });


})();
