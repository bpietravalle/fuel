(function() {
    "use strict";

    describe("Geofire Option", function() {
        var rec1, points, keyMock, $timeout, test1, rootPath, locData, test, ref, $rootScope, fuel, subject, $q;

        beforeEach(function() {
            rootPath = "https://your-firebase.firebaseio.com";
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
            module("testutils");
            module("firebase.fuel",
                function($provide) {
                    $provide.factory("location", function($q) {
                        var location = {
                            add: keyMock("add", $q),
                            removeoc: keyMock("remove", $q)

                        };

                        return location;

                    });
                    $provide.factory("differentLocation", function() {
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


            inject(function(_$timeout_, _$q_, _$rootScope_, _fuel_) {
								$q = _$q_;
                $timeout = _$timeout_;
                $rootScope = _$rootScope_;
                fuel = _fuel_;
            });

            points = "trips";
            spyOn($q, "reject").and.callThrough();
            subject = fuel("geofire", {
                geofire: true
            });
        });
        afterEach(function() {
            subject = null;
            fuel = null;
        });
        describe("Commands", function() {
            describe("*Single Record*", function() {
                describe("addRecordKey()", function() {
                    beforeEach(function() {
                        subject = fuel("geofire", {
                            geofire: true,
                            foreignKeys: {
                                "trips": "tripId",
                                "flights": "flightId"
                            }
                        });
                        subject.ref().push(locData[0]);
                        subject.ref().flush();
                        this.ref1 = subject.ref()._lastAutoId;
                        test = subject.addRecordKey("trips", this.ref1, "uniqueKey");
                        $timeout.flush();
                        $rootScope.$digest();
                    });
                    it("Should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should add the correct key and property to the location record", function() {
                        var queue = subject.ref().child(this.ref1).getFlushQueue()[0];
                        var ctx = queue.context;
                        var data = queue.sourceData;
                        expect(ctx.key()).toEqual(this.ref1);
                        expect(data.method).toEqual("update");
                        expect(data.args[0]).toEqual({
                            tripId: "uniqueKey"
                        });
                    });
                    it("should throw error if key doesn't exist", function() {
                        expect(function() {
                            subject.addRecordKey("phones", "string", "another");
                        }).toThrow();
                    });
                });
                describe("add", function() {
                    beforeEach(function() {
                        test = subject.add(locData[0], null, points);
                        flushTime();
                        this.key = subject.ref().key();
                    });

                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should remove coordinates from main array", function() {
                        var d = subject.ref().getData();
                        expect(d).toBeDefined();
                        expect(subject.path()).toEqual(rootPath + "/geofire/" + this.key);
                        expect(d.lat).not.toBeDefined();
                        expect(d.lon).not.toBeDefined();
                    });
                    it("should save data to main array", function() {
                        var d = subject.ref().getData();
                        expect(d.place_id).toEqual("string");
                        expect(d[this.key]).not.toBeDefined();
                    });
                    it("should return an array of main record firebaserefs", function() {
                        $rootScope.$digest();
                        $timeout.flush();
                        expect(getPromValue(test)[0]).toBeAFirebaseRef();
                        expect(getPromValue(test)[0].toString()).toEqual(rootPath + "/geofire/" + this.key);
                        expect(getPromValue(test)).toBeAn("array");
                    });
                    it("should add coordinates to coordinates node", function() {
                        $rootScope.$digest();
                        $timeout.flush();
                        var d = subject.base().ref();
                        d.flush();
                        expect(d.toString()).toEqual(rootPath + "/geofire/" + points);
                        expect(d.getData()[this.key]).toEqual({
                            "g": jasmine.any(String),
                            "l": [90, 100]
                        });
                    });
                    it("should set current ref to main array record", function() {
                        expect(subject.path()).toEqual(rootPath + "/geofire/" + this.key);
                    });
                    qReject(0);
                });
                describe("remove", function() {
                    beforeEach(function() {
                        test1 = subject.remove("key", null, points);
                        flushTime()
                    });
                    it("should be a promise", function() {
                        expect(test1).toBeAPromise();
                    });
                    it("should remove data from main array", function() {
                        expect(Object.keys(subject.ref().parent().children)[0]).toEqual(points);
                        //         expect(this.ref1.getData()).toEqual(locData[0]);
                        //         expect(this.mainRef.getData()).toEqual(null);
                    });
                    it("should remove the points from points node", function() {
                        var p = subject.ref().getData().key;
                        expect(p).toEqual(null);
                    });
                    it("should set ref to points node", function() {
                        $rootScope.$digest();
                        expect(subject.path()).toEqual(rootPath + "/geofire/" + points);
                    });
                    qReject(0);
                });
            });
            describe("*Multiple Records", function() {
                describe("add()", function() {
                    beforeEach(function() {
                        test = subject.add(locData, null, points);
                        flushTime();
                        $rootScope.$digest();
                        // flushTime();
                        $timeout.flush();
                        // $rootScope.$digest();
                        this.mainRef = subject.ref().root().child("geofire");
                        this.keys = Object.keys(this.mainRef.children);
                        rec1 = this.mainRef.child(this.keys[0]);
                        // rec2 = this.mainRef.child(this.keys[1]);
                    });
                    it("should be a promise", function() {
                        expect(this.keys).toBeAn("array");
                        expect(test).toBeAPromise();
                    });
                    it("should remove coordinates from main array records", function() {
                        expect(rec1.getData()).toBeDefined();
                        expect(rec1.getData().lat).not.toBeDefined();
                        expect(rec1.getData().lon).not.toBeDefined();
                        // expect(rec2.getData()).toBeDefined();
                        // expect(rec2.getData().lat).not.toBeDefined();
                        // expect(rec2.getData().lon).not.toBeDefined();
                    });
                    it("should save data to main array", function() {
                        // expect(rec1.getData()).toEqual({
                        //     place_id: "string",
                        //     placeType: "a place",
                        //     distance: 1234,
                        //     closeBy: true
                        // });
                        expect(rec1.getData()).toEqual({
                            place_id: "different_place",
                            placeType: "some place",
                            distance: 1000,
                            closeBy: false
                        });
                    });
                    it("should add coordinates to coordinates node", function() {
                        var d = subject.base().ref();
                        expect(d.toString()).toEqual(rootPath + "/geofire/" + points);
                        d.flush();
                        // expect(d.getData()[this.keys[0]]).toEqual({
                        //     "g": jasmine.any(String),
                        //     "l": [90, 100]
                        // });
                        expect(d.getData()[this.keys[0]]).toEqual({
                            "g": jasmine.any(String),
                            "l": [45, 100]
                        });
                    });
                    // it("should return an array of firebaseRefs", function() {
                    // $rootScope.$digest();
                    // expect(getPromValue(test)).toEqual(rootPath + "/geofire/" + this.keys[0]);
                    //         expect(getPromValue(test)[1].toString()).toEqual(rootPath + "/geofire/" + this.keys[1]);
                    // });
                    it("should set current ref to the last main array record", function() {
                        expect(subject.path()).toEqual(rootPath + "/geofire/" + this.keys[0]);
                    });
                    qReject(0);
                });
                describe("remove", function() {
                    beforeEach(function() {
                        test1 = subject.remove("key", null, points);
                        flushTime()
                            //     test1 = subject.remove(this.keys);
                            //     $rootScope.$digest();
                            //     flushTime();
                            //     $rootScope.$digest();
                    });
                    it("should be a promise", function() {
                        expect(test1).toBeAPromise();
                    });
                    // it("should remove records from main array", function() {
                    //     var p = subject.base().ref().root().child("geofire");
                    //     expect(p.child(this.keys[0]).getData()).toEqual(null);
                    //     expect(p.child(this.keys[1]).getData()).toEqual(null);
                    // });
                    // it("should remove the points from points node", function() {
                    //     var p = subject.ref();
                    //     expect(p.getData()[this.keys[0]]).toEqual(null);
                    //     expect(p.getData()[this.keys[1]]).toEqual(null);
                    // });
                    it("should set ref to mainref", function() {
                        expect(subject.path()).toEqual(rootPath + "/geofire/" + points);
                    });
                    qReject(0);
                });
            });
        });
        describe("Queries: ", function() {
            describe("get", function() {
                beforeEach(function() {
                    ref = subject.ref().child(points);
                    ref.set({
                        "keyOne": {
                            "g": "string",
                            "l": [90, 100]
                        }
                    });
                    ref.flush();
                    test = subject.get("keyOne", points);
                    $rootScope.$digest();
                    $timeout.flush();
                    $rootScope.$digest();
                });
                it("should be a promise", function() {
                    expect(test).toBeAPromise();
                });
                it("should retrieve the correct record", function() {
                    var f = subject.ref().getFlushQueue()[0].context;
                    expect(f).toBeAFirebaseRef();
                    expect(f.key()).toEqual("keyOne");
                    // expect(f.getData()).toEqual({
                    //     "g": jasmine.any(String),
                    //     "l": [90, 100]
                    // });
                });
                qReject(0);
            });
            // describe("query", function() {
            // beforeEach(function() {
            //         // subject.set("key2", [50, 100]);
            //         // flushTime();
            //         test = subject.query({
            //             center: [90, 100],
            //             radius: 10
            //         });
            //         extendMockFb(subject.ref());
            //         $rootScope.$digest();
            //         $timeout.flush();
            // });
            //     it("should be a promise", function() {
            //         expect(test).toBeAPromise();
            //     });
            //     it("should retrieve the correct record", function() {
            //         expect(subject.path()).toEqual(rootPath + "/geofire/points");
            //     });
            //     it("should return a geoQuery", function() {
            //         expect(getPromValue(test)).toEqual(jasmine.objectContaining({
            //             updateCriteria: jasmine.any(Function),
            //             radius: jasmine.any(Function),
            //             center: jasmine.any(Function),
            //             cancel: jasmine.any(Function),
            //             on: jasmine.any(Function)
            //         }));
            //     });
            describe("loadRecordLocations", function() {
                beforeEach(function() {
                    test = subject.loadRecordLocations("tripId", "uniqueKey");
                    extend(subject.ref());
                    $rootScope.$digest();
                });
                it("should be a promise", function() {
                    expect(test).toBeAPromise();
                });
                it("should call orderByChild", function() {

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


        function flushTime() {
            $rootScope.$digest();
            $timeout.flush();
            subject.ref().flush();
            $rootScope.$digest();
        }

        function extend(obj) {
            var extension = {
                orderByChild: jasmine.createSpy("orderByChild").and.callFake(function() {
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
                })
            };
            return _.merge(obj, extension);
        }


    });



})();
