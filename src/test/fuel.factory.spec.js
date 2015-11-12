(function() {
    "use strict";

    describe("Fuel Factory", function() {
        var firePath, geofire, keyMock, location, $timeout, arrData, newData, newRecord, test1, session, lastRecs, recRemoved, rootPath, copy, keys, testutils, root, success, failure, recAdded, sessionSpy, locData, userId, maSpy, maSpy1, mrSpy, naSpy, nrSpy, fsMocks, geo, test, ref, objRef, objCount, arrCount, arrRef, $rootScope, data, user, location, locationSpy, $injector, inflector, fsType, userSpy, fsPath, options, fbObject, fbArray, pathSpy, $provide, fuel, subject, path, fireStarter, $q, $log;


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
                closeBy: null //false doesn't work
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
            angular.module("firebase-fuel")
                .constant("FBURL", "https://your-firebase.firebaseio.com/")
                .factory("location", function($q) {
                    var location = {
                        add: keyMock("add",$q),
                        remove: keyMock("remove",$q),

                    };

                    return location;

                })
                .factory("geofire", function($q) {
                    var geofire = {
                        set: keyMock("set",$q),
                        remove: keyMock("remove",$q),
                        get: keyMock("get",$q),

                    };

                    return geofire;

                })
                .factory("user", function() {
                    return jasmine.createSpyObj("user", ["addIndex", "removeIndex"]);
                })
                .factory("session", function() {
                    return {
                        getId: jasmine.createSpy("getId").and.callFake(function() {
                            userId = 1;
                            return userId;
                        })
                    }
                });
            module("testutils");
            module("firebase-fuel");

            inject(function(_user_, _testutils_, _location_,_geofire_, _$timeout_, _$log_, _firePath_, _session_, _$rootScope_, _fuel_, _inflector_, _fireStarter_, _$q_) {
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

            describe("currentRef", function() {
                it("should be defined on initialization", function() {
                    expect(subject.currentRef()).toBeDefined();
                });
            });
            describe("currentPath", function() {
                it("should be defined on initalization", function() {
                    expect(subject.currentPath()).toBeDefined();
                });
            });
        });
        describe("Main methods", function() {
            beforeEach(function() {
                options = {
                    user: true,
                    geofire: true
                };
                subject = fuel("trips", options);
            });
            describe("commands", function() {
                describe("add", function() {
                    beforeEach(function() {
                        test = subject.add(newRecord);
                        $rootScope.$digest();
                        subject.currentRef().flush();
                        $rootScope.$digest();
                        this.key = subject.currentRef().key();
                    });
                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should return a firebaseRef", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                    });
                    it("should change the currentRef() to the added record's ref", function() {
                        expect(subject.currentPath()).toEqual("https://your-firebase.firebaseio.com/trips/" + this.key);
                    });
                    it("should save the data to firebaseRef", function() {
                        expect(getPromValue(test).getData()).toEqual(newRecord);
                    });
                    describe("user option", function() {
                        describe("if true", function() {
                            beforeEach(function() {
                                var data = {
                                    rec: newRecord,
                                    geo: locData
                                };
                                test = subject.add(data, null, true);
                                $rootScope.$digest();
                                subject.currentRef().flush();
                                $rootScope.$digest();
                                $rootScope.$digest();
                            });
                            it("should add uid property to record", function() {
                                expect(getPromValue(test).getData().uid).toEqual(1);
                                expect(getPromValue(test).getData()).toBeDefined();
                            });
                        });
                        describe("if undefined", function() {
                            beforeEach(function() {
                                var data = {
                                    rec: newRecord,
                                    geo: locData
                                };
                                test1 = subject.add(data);
                                $rootScope.$digest();
                                subject.currentRef().flush();
                                $rootScope.$digest();
                            });
                            it("should not add uid property to record", function() {
                                expect(getPromValue(test1).getData().uid).not.toBeDefined();
                                expect(getPromValue(test1).getData()).toBeDefined();
                            });

                        });

                    });
                    describe("geo option", function() {
                        describe("if true", function() {
                            beforeEach(function() {
                                var data = {
                                    rec: newRecord,
                                    geo: locData
                                };
                                test1 = subject.add(data, true);
                                $rootScope.$digest();
                                subject.currentRef().flush();
                                $rootScope.$digest();
                            });
                            it("should not send full data object to mainArray if arg = true", function() {
                                expect(getPromValue(test1, true).geo).not.toBeDefined();
                                expect(getPromValue(test1, true)).toBeDefined();
                            });
                        });
                        describe("if undefined", function() {
                            beforeEach(function() {
                                var data = {
                                    rec: newRecord,
                                    geo: locData
                                };
                                test1 = subject.add(data);
                                $rootScope.$digest();
                                subject.currentRef().flush();
                                $rootScope.$digest();
                            });
                            it("should send full data object to mainArray if arg is undefined", function() {
                                expect(getPromValue(test1).getData().geo).toBeDefined();
                                expect(getPromValue(test1).getData()).toBeDefined();
                            });
                        });
                    });
                });

                describe("save", function() {
                    beforeEach(function() {
                        $rootScope.$digest();
                        subject.currentRef().child("trips").set(arrData);
                        $rootScope.$digest();
                    });
                    describe("If pass an array", function() {
                        beforeEach(function() {
                            subject.load();
                            $rootScope.$digest();
                            subject.currentRef().flush();
                            $rootScope.$digest();
                            this.name = subject.currentBase()[0].firstName;
                            this.phone = subject.currentBase()[1].phone;
                            subject.currentBase()[0].firstName = "john jacob";
                            $rootScope.$digest();
                        });
                        describe("If second arg is the record", function() {
                            beforeEach(function() {
                                test = subject.save([subject.currentBase(), subject.currentBase()[0]]);
                                $rootScope.$digest();
                                subject.currentRef().flush();
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
                                test = subject.save([subject.currentBase(), 0]);
                                $rootScope.$digest();
                                subject.currentRef().flush();
                                $rootScope.$digest();
                            });
                            it("should save record if pass an arrary with [fireBaseArray, index]", function() {
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
                            subject.currentRef().flush();
                            $rootScope.$digest();
                            this.name = subject.currentBase().firstName;
                            subject.currentBase().firstName = "john jacob";
                            $rootScope.$digest();
                            test = subject.save(subject.currentBase());
                            $rootScope.$digest();
                            subject.currentRef().flush();
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
                        it("should change the currentRef() to the saved record's ref", function() {
                            expect(subject.currentPath()).toEqual("https://your-firebase.firebaseio.com/trips/0");
                        });
                        qReject(0);
                    });

                });
                describe("addIndex", function() {
                    beforeEach(function() {
                        $rootScope.$digest();
                        test = subject.addIndex("1", "hotels", "string");
                        $rootScope.$digest();
                        $timeout.flush();
                        subject.currentRef().flush();
                        $rootScope.$digest();
                    });
                    it("should be a promise", function() {
                        expect(test).toBeAPromise();
                    });
                    it("should set currentRef to user Index", function() {
                        expect(subject.currentPath()).toEqual(rootPath + "/trips/1/hotels");
                    });
                    it("should add data the user index", function() {
                        expect(subject.currentRef().getData()).toEqual({
                            "string": true
                        });
                    });
                    it("should return the firebaseRef of the user index", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                        expect(getPromValue(test).path).toEqual(subject.currentPath());
                    });
                    qReject(0);

                    describe("removeIndex", function() {
                        beforeEach(function() {
                            $rootScope.$digest();
                            test = subject.removeIndex("1", "hotels", "string");
                            $rootScope.$digest();
                            $timeout.flush();
                            subject.currentRef().flush();
                            $rootScope.$digest();
                        });
                        it("should be a promise", function() {
                            expect(test).toBeAPromise();
                        });
                        it("should set currentRef to user Index", function() {
                            expect(subject.currentPath()).toEqual(rootPath + "/trips/1/hotels");
                        });
                        it("should remove the key from the user index", function() {
                            expect(getPromValue(test).getKeys()).toBeEmpty();
                            expect(subject.currentRef().getData()).toBe(null);
                        });
                        it("should return the firebaseRef of the user index", function() {
                            expect(getPromValue(test)).toBeAFirebaseRef();
                            expect(getPromValue(test).path).toEqual(subject.currentPath());
                        });
                        qReject(0);
                    });
                });
                describe("removeMainRecord", function() {
                    beforeEach(function() {
                        $rootScope.$digest();
                        subject.currentRef().child("trips").push(arrData);
                        $rootScope.$digest();
                        test = subject.remove(0);
                        $rootScope.$digest();
                        subject.currentRef().flush();
                        $rootScope.$digest();
                    });
                    it("should remove the record and return a firebaseRef", function() {
                        expect(getPromValue(test)).toBeAFirebaseRef();
                        expect(getPromValue(test).path).toEqual("https://your-firebase.firebaseio.com/trips/0");
                    });
                    it("should change the currentRef() to the removed record's ref", function() {
                        expect(subject.currentPath()).toEqual("https://your-firebase.firebaseio.com/trips/0");
                    });
                    qReject(0);
                    useCurrentRef();
                });
                describe("Simple Geofire Commands", function() {
                    beforeEach(function() {
                        options = {
                            gps: true
                        };
                        subject = fuel("trips", options);
                        $rootScope.$digest();
                        test = subject.add(newRecord);
                        flush();
                        this.key = dataKeys(subject.currentRef())[0];
                    });
                    it("should equal", function() {
                        expect(this.key).toEqual(jasmine.any(String));
                    });
                    // describe("addLocationIndex", function() {
                    //     beforeEach(function() {
                    //         $rootScope.$digest();
                    //         test = subject.addLocationIndex(this.key, "string");
                    //         $rootScope.$digest();
                    //         $timeout.flush();
                    //         subject.currentRef().flush();
                    //         $rootScope.$digest();
                    //     });
                    //     it("should be a promise", function() {
                    //         expect(test).toBeAPromise();
                    //     });
                    //     it("should set currentRef to location Index", function() {
                    //         expect(subject.currentPath()).toEqual(rootPath + "/trips/" + this.key + "/locations");
                    //     });
                    //     it("should add data the location index", function() {
                    //         expect(subject.currentRef().getData()).toEqual({
                    //             "string": true
                    //         });
                    //     });
                    //     it("should return the firebaseRef of the location index", function() {
                    //         expect(getPromValue(test)).toBeAFirebaseRef();
                    //         expect(getPromValue(test).path).toEqual(subject.currentPath());
                    //     });
                    //     qReject(0);

                    //     describe("removeLocationIndex", function() {
                    //         beforeEach(function() {
                    //             $rootScope.$digest();
                    //             test = subject.removeLocationIndex(this.key, "string");
                    //             $rootScope.$digest();
                    //             $timeout.flush();
                    //             subject.currentRef().flush();
                    //             $rootScope.$digest();
                    //         });
                    //         it("should be a promise", function() {
                    //             expect(test).toBeAPromise();
                    //         });
                    //         it("should set currentRef to location Index", function() {
                    //             expect(subject.currentPath()).toEqual(rootPath + "/trips/" + this.key + "/locations");
                    //         });
                    //         it("should remove the key from the location index", function() {
                    //             expect(getPromValue(test).getKeys()).toBeEmpty();
                    //             expect(subject.currentRef().getData()).toBe(null);
                    //         });
                    //         it("should return the firebaseRef of the location index", function() {
                    //             expect(getPromValue(test)).toBeAFirebaseRef();
                    //             expect(getPromValue(test).path).toEqual(subject.currentPath());
                    //         });
                    //         qReject(0);
                    //     });
                    // });
                    // describe("geofireSet", function() {
                    //     beforeEach(function() {
                    //         test = subject.geofireSet("myKey", [90, 100]);
                    //         $rootScope.$digest();
                    //         subject.currentRef().flush();
                    //         $rootScope.$digest();
                    //         $rootScope.$digest();
                    //         this.ref = subject.currentRef();
                    //     });
                    //     it("should return a promise", function() {
                    //         expect(test).toBeAPromise();
                    //     });
                    //     it("should add data to correct array", function() {
                    //         expect(this.ref.getData()).toEqual({
                    //             myKey: {
                    //                 g: jasmine.any(String),
                    //                 l: [90, 100]
                    //             }
                    //         });
                    //     });
                    //     it("should return null", function() {
                    //         expect(getPromValue(test)).toEqual(undefined);
                    //     });
                    //     qReject(0);
                    //     describe("geofireRemove", function() {
                    //         beforeEach(function() {
                    //             test = subject.geofireRemove("myKey");
                    //             $rootScope.$digest();
                    //             subject.currentRef().flush();
                    //             $rootScope.$digest();
                    //             this.ref = subject.currentRef();
                    //         });
                    //         it("should return a promise", function() {
                    //             expect(test).toBeAPromise();
                    //         });
                    //         it("should return null", function() {
                    //             expect(getPromValue(test)).toEqual(undefined);
                    //         });
                    //         it("should remove data correctly", function() {
                    //             expect(this.ref.path).toEqual(rootPath + "/geofire/trips");
                    //             expect(this.ref.getData()).toEqual(null);
                    //         });
                    //         qReject(0);
                    //     });
                    // });
                    describe("createLocation", function() {
                        beforeEach(function() {
                            test = subject.createLocation(locData[0]);
													// flush();	
                            // $rootScope.$digest();
                            // this.ref = subject.currentRef();
                            // this.key = this.ref.key().toString();
                        });
                        it("should call add() on location factory", function() {
                            expect(location.add).toHaveBeenCalledWith(locData[0], undefined);
                        });
                        it("should return a promise", function() {
                            expect(test).toBeAPromise();
                        });
                        it("should add data to correct array", function() {
                            // expect(getPromValue(test)).toEqual(locData[0]);
                        });
                        // it("should return the correct firebaseRef", function() {
                        //     expect(this.ref.path).toEqual("https://your-firebase.firebaseio.com/locations/trips/" + this.key);
                        // });
                        // it("should return an array with a firebaseRef and a object with coordinates", function() {
                        //     expect(getPromValue(test).length).toEqual(2);
                        //     expect(getPromValue(test)[0]).toBeAFirebaseRef();
                        //     expect(getPromValue(test)[1]).toEqual({
                        //         lat: 90,
                        //         lon: 100
                        //     });
                        // });
                        describe("removeLocation", function() {
                            beforeEach(function() {
                                test = subject.removeLocation(0);
                                $rootScope.$digest();
                                // subject.currentRef().flush();
                                // $rootScope.$digest();
                            });
                            it("should call remove() on location factory", function() {
                                expect(location.remove).toHaveBeenCalledWith(0);
                            });
                            // logCheck();
                            // it("should remove the record", function() {
                            //     expect(this.arrLength).toEqual(1);
                            //     expect(subject.currentRef().getData()).toEqual(null);
                            //     expect(getRefData(subject.currentParentRef())).toEqual(null);
                            // });
                            // useParentRef();
                            // it("should return the firebaseRef of the removed record", function() {
                            //     expect(getPromValue(test)).toBeAFirebaseRef();
                            //     expect(subject.currentPath()).toEqual(rootPath + "/locations/trips/0");
                            // });

                            // qReject(0);
                        });
                    });
                });
            });
            describe("Queries", function() {
                // describe("userRecordsByIndex", function() {
                //     beforeEach(function() {
                //         $rootScope.$digest();
                //         subject.currentRef().child("trips").push(arrData[0]);
                //         subject.currentRef().flush();
                //         $rootScope.$digest();
                //         subject.currentRef().child("trips").push(arrData[1]);
                //         subject.currentRef().flush();
                //         $rootScope.$digest();
                //         subject.currentRef().child("trips").push(arrData[2]);
                //         subject.currentRef().flush();
                //         $rootScope.$digest();
                //         subject.currentRef().child("trips").push(arrData[3]);
                //         subject.currentRef().flush();
                //         $rootScope.$digest();
                //         this.keys = dataKeys(subject.currentRef().child("trips"));
                //         test = subject.userRecordsByIndex();
                //         $rootScope.$digest();
                //         // subject.currentRef().flush();
                //         $rootScope.$digest();
                //         $timeout.flush();
                //     });
                //     it("should return a promise", function() {
                //         expect(this.keys.length).toEqual(4);
                //         expect(test).toBeAPromise();
                //     });
                //     it("should get correct records", function() {

                //     });

                //     // logCheck();


                // });
                describe("load", function() {
                    beforeEach(function() {
                        $rootScope.$digest();
                        subject.currentRef().child("trips").push(arrData[0]);
                        subject.currentRef().flush();
                        $rootScope.$digest();
                        subject.currentRef().child("trips").push(arrData[1]);
                        subject.currentRef().flush();
                        $rootScope.$digest();
                    });
                    describe("Without passing an argument", function() {
                        beforeEach(function() {
                            test = subject.load();
                            $rootScope.$digest();
                            subject.currentRef().flush();
                            $rootScope.$digest();
                            this.key = subject.currentBase()[0].$id;
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
                                subject.currentRef().flush();
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
                        $rootScope.$digest();
                        subject.currentRef().child("trips").update({
                            "string": true
                        });
                        subject.currentRef().flush();
                        $rootScope.$digest();
                        subject.currentRef().child("trips").update({
                            "another": true
                        });
                        subject.currentRef().flush();
                        $rootScope.$digest();
                        this.ref = subject.currentRef().child("trips");
                    });
                    it("should work", function() {
                        expect(dataKeys(this.ref).length).toEqual(2)
                    });
                });
                describe("geofireGet", function() {
                    // beforeEach(function() {
                    //     $rootScope.$digest();
                    //     subject.geofireSet("key", [90, 100]);
                    //     flush();
                    //     test = subject.geofireGet("key");
                    //     flush();
                    // });
                    // it("should be a promise", function() {
                    //     expect(test).toBeAPromise();
                    // });
                    // it("should set currentRef to correct firebaseRef", function() {
                    //     expect(subject.currentPath()).toEqual(rootPath + "/geofire/trips");
                    // });
                    // it("should get correct data", function() {
                    //     expect(subject.currentRef().getData()["key"]).toEqual({
                    //         g: jasmine.any(String),
                    //         l: [90, 100]
                    //     });
                    // });
                });
            });
        });
        describe("With User Object access", function() {
            beforeEach(function() {
                options = {
                    user: true
                };
                subject = fuel("trips", options);
                test = subject.createWithUser(locData[0]);
                $rootScope.$digest();
                flush();
            });
            describe("createWithUser", function() {
                // it("should call addIndex() on userObject", function() {
                //     test = subject.addUserIndex("key");
                //     expect(user.addIndex).toHaveBeenCalledWith("trips", "key");
                // });
                // it("should set the currentRef to the user Index", function() {
                //     expect(subject.currentPath()).toEqual(rootPath + "/users/1/trips");
                //     expect(dataKeys(this.key)[0]).toEqual(jasmine.any(String));
                // });
                // it("should add record to mainArray", function() {
                //     expect(this.key.getData()[dataKeys(this.key)[0]]).toEqual(newRecord);
                // });
                // it("should add key to user Index", function() {
                //     expect(subject.currentRef().child(dataKeys(this.key)[0]).getData()).toEqual(true);
                // });
            });
            describe("removeWithUser", function() {
                beforeEach(function() {
                    this.beforeIdx = subject.currentRef();
                    test = subject.removeWithUser(dataKeys(this.key)[0]);
                    $rootScope.$digest();
                    subject.currentRef().flush();
                    this.after = subject.currentRef();
                    $rootScope.$digest();
                    $timeout.flush();
                    $rootScope.$digest();
                });
                // it("should set the currentRef to the user Index", function() {
                //     expect(subject.currentPath()).toEqual(rootPath + "/users/1/trips");
                //     expect(dataKeys(this.key)[0]).toEqual(jasmine.any(String));
                // });
                // it("should remove the record from the mainArray", function() {
                //     expect(this.after.getData()).toEqual(null);
                //     expect(this.after.getKeys()).toBeEmpty();
                // });
                // it("should remove the key from user Index", function() {
                //     expect(subject.currentRef().child(dataKeys(this.key)[0]).getData()).toBe(null);
                // });
            });
            describe("saveWithUser", function() {});
        });


        // describe("User", function() {
        //     describe("createUserRecord", function() {
        //         beforeEach(function() {
        //             test = subject.createUserRecord(newData);
        //             $rootScope.$digest();
        //             subject.currentRef().flush();
        //             $rootScope.$digest();
        //         });
        //         it("should return a promise", function() {
        //             expect(test).toBeAPromise();
        //         });
        //         it("should add data to correct array", function() {
        //             var arr = subject.currentRef();
        //             var key = arr.key().toString();
        //             expect(arr.parent().path).toEqual("https://your-firebase.firebaseio.com/users/1/trips");
        //             expect(getRefData(arr)).toEqual(getRefData(subject.currentRef()));
        //         });
        //         it("should return the firebaseRef", function() {
        //             $rootScope.$digest();
        //             expect(getRefData(getPromValue(test))).toBeDefined();
        //         });


        //     });
        //     describe("removeUserRecord", function() {
        //         beforeEach(function() {
        //             subject.userNestedArray();
        //             $rootScope.$digest();
        //             subject.currentRef().set(arrData);
        //             $rootScope.$digest();
        //             subject.currentRef().flush();
        //             $rootScope.$digest();
        //             this.currentPath = subject.currentPath();
        //             this.arrLength = subject.currentBase().length();
        //             test = subject.removeUserRecord(0);
        //             $rootScope.$digest();
        //             subject.currentRef().flush();
        //             $rootScope.$digest();
        //         });
        //         it("should remove the record", function() {
        //             expect(this.arrLength).toEqual(2);
        //             expect(getRefData(subject.parentRef())).toEqual({
        //                 1: arrData[1]
        //             });
        //         });
        //         // logCheck();

        //         useParentRef();
        //         useCurrentRef();

        //         it("should return the firebaseRef of the removed record", function() {
        //             currentRefCheck("users/1/trips/0", true);
        //         });

        //         qReject(0);
        //     });
        // });

        // // });
        // //     describe("Simple Queries", function() {
        // //         describe("loadMainArray", function() {});
        // //         describe("loadMainRecord", function() {});
        // //         describe("Geofire", function() {
        // //             describe("geofireGet", function() {});
        // //             describe("loadLocationRecord", function() {});
        // //             describe("MainLocations", function() {});
        // //             describe("MainLocation", function() {});
        // //         });
        // //         describe("Nested Arrays", function() {});
        // describe("User", function() {
        //     describe("loadUserRecords", function() {
        //         //TODO add option for loading indexes
        //         beforeEach(function() {
        //             test = subject.loadUserRecords();
        //             $rootScope.$digest();
        //             subject.currentRef().flush()
        //             $rootScope.$digest();
        //         });
        //         it("should return a promise", function() {
        //             expect(test).toBeAPromise();
        //         });
        //         it("should load correct firebaseRef", function() {
        //             expect(getPromValue(test).$ref().path).toEqual("https://your-firebase.firebaseio.com/users/1/trips");
        //         });
        //         it("should return a fireBaseArray", function() {
        //             expect(getPromValue(test)).toEqual(jasmine.objectContaining({
        //                 $keyAt: jasmine.any(Function),
        //                 $indexFor: jasmine.any(Function),
        //                 $remove: jasmine.any(Function),
        //                 $getRecord: jasmine.any(Function),
        //                 $add: jasmine.any(Function),
        //                 $watch: jasmine.any(Function)
        //             }));
        //         });


        //     });
        //     describe("loadUserRecord", function() {
        //         //TODO add option for loading indexes
        //         beforeEach(function() {
        //             test = subject.loadUserRecord(1);
        //             $rootScope.$digest();
        //             subject.currentRef().flush()
        //             $rootScope.$digest();
        //         });
        //         it("should return a promise", function() {
        //             expect(test).toBeAPromise();
        //         });
        //         it("should load correct firebaseRef", function() {
        //             expect(getPromValue(test).$ref().path).toEqual("https://your-firebase.firebaseio.com/users/1/trips/1");
        //         });
        //         it("should return a fireBaseObject", function() {
        //             expect(getPromValue(test)).toEqual(jasmine.objectContaining({
        //                 $id: "1",
        //                 $priority: null,
        //                 $ref: jasmine.any(Function),
        //                 $value: null
        //             }));
        //         });
        //         it("should have a $ref() property equal to currentRef()", function() {
        //             expect(getPromValue(test).$ref()).toEqual(subject.currentRef());
        //         });
        //     });
        // });

        // // });
        // describe("Complex Commands", function() {
        // describe("Geofire", function() {
        //     describe("trackLocation", function() {});
        //     describe("untrackLocation", function() {});
        //     describe("trackLocations", function() {});
        //     describe("untrackLocations", function() {});
        // });
        // });
        // describe("Complex Queries", function() {
        // describe("loadMainFromUser", function() {

        // });

        // });

        describe("Nested Arrays", function() {
            beforeEach(function() {
                //         options = {
                //             nestedArrays: ["phones"],
                //             geofire: true

                //         };
                //         subject = fuel("trips", options);
                //         $rootScope.$digest();
                //         subject.createMainRecord({
                //             // $rootScope.$digest();
                //             // subject.currentRef().push({
                //             name: "bill",
                //             age: 100
                //         });
                //         $rootScope.$digest();
                //         subject.currentRef().flush();
                //         $rootScope.$digest();
                //         this.tripId = subject.currentRef().key();
            });
            //     var methods = ["addPhone", "removePhone", "loadPhone", "savePhone", "getPhone", "loadPhones", "phone", "phones"];

            //     function nestedArr(x) {
            //         it(x + " should be defined", function() {
            //             expect(subject[x]).toBeDefined();
            //         });
            //     }
            //     methods.forEach(nestedArr);
            //     it("simple checks on setup", function() {
            //         expect(getRefData(subject.currentRef())).toEqual({
            //             name: "bill",
            //             age: 100
            //         });
            //         expect(this.tripId).not.toEqual("trips");
            //         expect(this.tripId).toEqual(jasmine.any(String));

            //     });

            //     describe("add", function() {
            //         beforeEach(function() {
            //             subject.addPhone(this.tripId, {
            //                 type: "cell",
            //                 number: 123456789
            //             });
            //             $rootScope.$digest();
            //             subject.currentRef().flush();
            //             $rootScope.$digest();
            //             this.key = subject.currentRef().key();
            //         });
            //         it("should add data to correct node", function() {
            //             expect(subject.parentRef().path).toEqual(rootPath + "/trips/" + this.tripId + "/phones");
            //             expect(getRefData(subject.parentRef())[this.key]).toEqual({
            //                 type: "cell",
            //                 number: 123456789
            //             });
            //         });
            //         qReject(0);
            //         describe("remove", function() {
            //             beforeEach(function() {
            //                 subject.removePhone(this.tripId, this.key);
            //                 $rootScope.$digest();
            //                 subject.currentRef().flush();
            //                 $rootScope.$digest();
            //             });
            //             it("should remove the correct record", function() {
            //                 $rootScope.$digest();
            //                 expect(subject.parentRef().path).toEqual(rootPath + "/trips/" + this.tripId + "/phones");
            //                 expect(getRefData(subject.parentRef())).toEqual(null);
            //             });
            //             qReject(0);
            //         });
            //         describe("load", function() {
            //             beforeEach(function() {
            //                 subject.loadPhone(this.tripId, this.key);
            //                 $rootScope.$digest();
            //                 $timeout.flush();
            //                 subject.currentRef().flush();
            //                 $rootScope.$digest();
            //             });
            //             it("should load the correct record", function() {
            //                 expect(subject.currentPath()).toEqual(rootPath + "/trips/" + this.tripId + "/phones/" + this.key);
            //                 expect(getRefData(subject.parentRef())[this.key]).toEqual({
            //                     type: "cell",
            //                     number: 123456789
            //                 });
            //             });
            //             qReject(0);
            //         });
            //         describe("load All", function() {
            //             beforeEach(function() {
            //                 test = subject.loadPhones(this.tripId);
            //                 $rootScope.$digest();
            //                 $timeout.flush();
            //                 subject.currentRef().flush();
            //                 $rootScope.$digest();
            //             });
            //             it("should load the correct record", function() {
            //                 expect(subject.currentPath()).toEqual(rootPath + "/trips/" + this.tripId + "/phones");
            //                 expect(getPromValue(test)).not.toEqual(null);
            //                 expect(getRefData(subject.currentRef())[this.key]).toEqual({
            //                     type: "cell",
            //                     number: 123456789
            //                 });
            //             });
            //             qReject(0);
            //         });
            //         describe("getRecord", function() {
            //             //returns null
            //             beforeEach(function() {
            // // subject.mainArray();
            // // $rootScope.$digest();
            // // subject.currentRef().flush();
            // // $rootScope.$digest();
            //                 test = subject.getPhone(this.tripId, this.key);
            //                 $rootScope.$digest();
            // // $timeout.flush();
            //                 // subject.currentRef().flush();
            //                 $rootScope.$digest();
            //             });
            //             it("should return current record", function() {
            //                 // expect(subject.currentPath()).toEqual(rootPath + "/trips/" + this.tripId + "/phones");
            //                 // expect(getRefData(subject.parentRef())).toBe(null);
            //                 // expect(getPromValue(test)).toEqual(null);
            //             });
            //             // returnsArray();
            //             // logCheck();
            //             // qReject(0);
            //         });
            //         describe("save", function() {
            //             beforeEach(function() {
            //                 test = subject.loadPhone(this.tripId, this.key);
            //                 $rootScope.$digest();
            //                 subject.currentRef().flush();
            //                 $rootScope.$digest();
            //                 getRefData(subject.currentRef()).type = "fax";
            //                 test1 = subject.savePhone(this.tripId, 0);
            //                 $rootScope.$digest();
            // $timeout.flush();
            //                 // subject.currentRef().flush();
            //                 $rootScope.$digest();
            //             });
            //             it("should load it", function() {
            //                 expect(getPromValue(test).type).toEqual("cell");
            //                 // expect(test1).toEqual("fax");
            //             });
            //             // qReject(0);
            //             // logCheck();


            //         });
        });

        function wrapPromise(p) {
            return p.then(success, failure);
        }

        function arrCount(arr) {
            return arr.base().ref().length;
        }

        function getBaseResult(obj) {
            return obj.base().ref()['data'];
        }

        function getRefData(obj) {
            return obj.ref()['data'];
        }

        function getPromValue(obj, flag) {
            if (flag === true) {
                return obj.$$state.value['data'];
            } else {
                return obj.$$state.value;
            }
        }

        function currentPathCheck(path, flag) {
            var root = "https://your-firebase.firebaseio.com/";
            if (flag === true) {
                return expect(subject.currentRef().path).toEqual(root.concat(path));
            } else {
                it("should set the correct currentRef with childPath: " + path, function() {
                    expect(subject.currentRef().path).toEqual(root.concat(path));
                });
            }
        }

        function currentRefCheck(path, flag) {
            if (flag === true) {
                return expect(subject.currentRef()).toEqual("as");
            } else {
                it("should set the correct currentRef with childPath: " + path, function() {
                    expect(subject.currentRef()).toEqual("as");
                });
            }
        }

        function currentBaseCheck(type, test) {
            switch (type) {
                case "object":
                    it("should return a fireBaseObject", function() {
                        expect(test).toEqual(jasmine.objectContaining({
                            $id: "1",
                            $priority: null,
                            $ref: jasmine.any(Function),
                            $value: null
                        }));
                    });
                    break;
                case "array":
                    it("should return a fireBaseArray", function() {
                        expect(test).toEqual(jasmine.objectContaining({
                            $keyAt: jasmine.any(Function),
                            $indexFor: jasmine.any(Function),
                            $remove: jasmine.any(Function),
                            $getRecord: jasmine.any(Function),
                            $add: jasmine.any(Function),
                            $watch: jasmine.any(Function)
                        }));
                    });
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

        function returnsArray() {
            it("should return an array", function() {
                logContains("flattening results");
            });
        }

        function useParentRef() {
            it("should construct firebase from parentRef", function() {
                logContains("Using currentParentRef");
            });
        }

        function useNewBase() {
            it("should construct a new firebase", function() {
                logContains("Building new firebase");
            });
        }

        function useChildRef() {
            it("should construct firebase from childRef", function() {
                logContains("Building childRef");
            });
        }

        function useCurrentRef() {
            it("should reuse currentRef", function() {
                logContains("Reusing currentRef");
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
                    expect(subject).toEqual("heres the subject!");
                });

            }
        }



        function getDeferred(obj) {
            return obj.$$state.pending[0][0];
        }

        function promiseStatus(obj) {
            return obj.$$state.status;
        }

        function deferredStatus(obj) {
            return obj.$$state.pending[0][0].promise.$$state.status;
        }

        function resolveDeferred(obj, cb) {
            return obj.$$state.pending[0][0].resolve(cb);
        }

        function setChild(ref, path) {
            return ref.child(path);
        }

        function rejectDeferred(obj, cb) {
            return obj.$$state.pending[0][0].reject(cb);
        }

        function testInspect(x) {
            expect(x).toEqual("test");
        }

        function deferredValue(obj) {
            return obj.$$state.pending[0][0].promise.$$state.value; //.value;
        }

        function refData() {
            return subject.currentRef().getData();
        }

        function dataKeys(ref) {
            return Object.keys(ref.getData());
        }


        function flush() {
            $rootScope.$digest();
            subject.currentRef().flush();
            $rootScope.$digest();
        }

        function refReset() {
            subject.load();
            flush();
        }


    });


})();
