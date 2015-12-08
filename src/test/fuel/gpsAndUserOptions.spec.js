// (function() {
//     "use strict";

//     describe("Fuel Factory", function() {
//         var addArr, locRef, remArr, firePath, differentLocation, phones, phone, geofire, differentSession, keyMock, location, $timeout, arrData, newData, newRecord, test1, session, lastRecs, recRemoved, rootPath, copy, keys, testutils, root, success, failure, recAdded, sessionSpy, locData, userId, maSpy, maSpy1, mrSpy, naSpy, nrSpy, fsMocks, geo, test, ref, objRef, objCount, arrCount, arrRef, $rootScope, data, user, location, locationSpy, $injector, inflector, fsType, userSpy, fsPath, options, fbObject, fbArray, pathSpy, $provide, fuel, subject, path, fireStarter, $q, $log;

//         beforeEach(function() {
//             addArr = [];
//             remArr = [];
//             rootPath = "https://your-firebase.firebaseio.com";
//             arrData = [{
//                 phone: "123456890",
//                 uid: 1,
//                 firstName: "tom"

//             }, {
//                 phone: "0987654321",
//                 uid: 2,
//                 firstName: "frank"
//             }, {
//                 phone: "1221",
//                 uid: 2,
//                 firstName: "frank again"
//             }, {
//                 phone: "1990",
//                 uid: 1,
//                 firstName: "tom again"
//             }];

//             newData = {
//                 phone: "111222333",
//                 key: function() {
//                     return "key";
//                 },
//                 firstName: "sally"
//             };

//             newRecord = {
//                 phone: "111222333",
//                 firstName: "sally"
//             };

//             locData = [{
//                 lat: 90,
//                 lon: 100,
//                 place_id: "string",
//                 placeType: "a place",
//                 distance: 1234,
//                 closeBy: true
//             }, {
//                 lat: 45,
//                 lon: 100,
//                 place_id: "different_place",
//                 placeType: "some place",
//                 distance: 1000,
//                 closeBy: false
//             }];
//             keyMock = function(id, q) {
//                 return jasmine.createSpy(id).and.callFake(function() {
//                     var mock = {
//                         key: function() {
//                             return id + "Key";
//                         }
//                     }
//                     return q.when(mock);
//                 });
//             };
//             angular.module("firebase.fuel")
//                 .config(function(fuelConfigurationProvider) {
//                     fuelConfigurationProvider.setRoot(rootPath);
//                 })
//                 .factory("geofire", function($q) {
//                     var geofire = {
//                         add: jasmine.createSpy("add").and.callFake(function(args) {
//                             locRef = new MockFirebase(rootPath).child("geofire");
//                             return $q.all(args.map(function(arg) {
//                                 var l = locRef.push(arg);
//                                 l.flush();
// 																addArr.push(l.key());
//                                 return l;


//                             }));
//                         }),
//                         remove: jasmine.createSpy("remove").and.callFake(function(args) {
//                             locRef = new MockFirebase(rootPath).child("geofire");
//                             return $q.all(args.map(function(arg) {
//                                 var l = locRef.push(arg);
//                                 l.flush();
// 																remArr.push(l.key());
//                                 return l;


//                             }));
//                         })
//                     };

//                     return geofire;
//                 })
//                 .factory("differentLocation", function($q) {
//                     var location = {
//                         add: jasmine.createSpy("add").and.callFake(function(data, s, flag) {
//                             if (flag === true) {
//                                 delete data.lat;
//                                 delete data.lon;
//                             }

//                             ref = new MockFirebase("locations");

//                             ref.push(data);
//                             ref.flush();
//                             var key = ref._lastAutoId;
//                             remArr.push(key);
//                             return $q.when(ref.child(key));
//                         })

//                     };

//                     return location;
//                 })
//                 .factory("user", function($q) {
//                     var user = {
//                         addIndex: keyMock("addIndex", $q),
//                         removeIndex: keyMock("removeIndex", $q),
//                         getIndexKeys: function() {
//                             return "spy";
//                         }
//                     };

//                     return user;
//                 })
//                 .factory("session", function() {
//                     return {
//                         getId: function() {}
//                     }
//                 })
//                 .factory("differentSession", function() {
//                     return {
//                         differentMeth: function() {}
//                     }
//                 });

//             module("testutils");
//             module("firebase.fuel");

//             inject(function(_user_, _differentLocation_, _testutils_, _differentSession_, _location_, _geofire_, _$timeout_, _$log_, _firePath_, _session_, _$rootScope_, _fuel_, _inflector_, _fireStarter_, _$q_) {
//                 differentLocation = _differentLocation_;
//                 differentSession = _differentSession_;
//                 geofire = _geofire_;
//                 user = _user_
//                 $timeout = _$timeout_;
//                 location = _location_;
//                 testutils = _testutils_;
//                 session = _session_;
//                 $rootScope = _$rootScope_;
//                 inflector = _inflector_;
//                 firePath = _firePath_;
//                 fuel = _fuel_;
//                 fireStarter = _fireStarter_;
//                 $q = _$q_;
//                 $log = _$log_;
//             });

//             spyOn($q, "reject").and.callThrough();
//             spyOn($log, "info").and.callThrough();
//         });
//         afterEach(function() {
//             location = null;
//             subject = null;
//             fireStarter = null;
//             firePath = null;
//             fuel = null;
//         });


//         describe("With User And GPS Options", function() {
//             beforeEach(function() {
//                 spyOn(session, "getId").and.returnValue(1);
//                 options = {
//                     user: true,
//                     gps: true
//                 }
//                 subject = fuel("trips", options);
//             });
//             describe("Commands: ", function() {
//                 beforeEach(function() {
//                     test = subject.add(newRecord, locData);
// 										flush();
//                     this.data = subject.ref().getData();
//                     this.path = subject.path();
//                     this.key = subject.parent().key();
//                     $timeout.flush();
//                     flush();
//                     this.key1 = addArr[0];
//                     this.key2 = addArr[1];
//                 });

//                 describe("add()", function() {
//                     it("should be a promise", function() {
//                         expect(test).toBeAPromise();
//                     });
//                     it("should add record to main array", function() {
//                         var mainRef = subject.ref().root().child("trips/" + this.key);
//                         var loc = mainRef.child("locations");
//                         expect(mainRef.getData()).toEqual(jasmine.objectContaining(newRecord));
//                         expect(loc.getData()[this.key1]).toEqual(true);
//                         expect(loc.getData()[this.key2]).toEqual(true);
//                     });
//                     it("should add uid property to main record", function() {
//                         var mainRef = subject.ref().root().child("trips/" + this.key);
//                         expect(mainRef.getData().uid).toEqual(1);
//                     });
//                     it("should call user.addIndex with correct path and main record key", function() {
//                         expect(user.addIndex).toHaveBeenCalledWith(null, "trips", this.key);
//                     });
//                     it("should add records to main location array", function() {
//                         expect(geofire.add.calls.argsFor(0)[0]).toEqual(locData);
//                     });
//                     it("should add location indices to main record and set ref to main record", function() {
//                         expect(this.path).toEqual(rootPath + "/trips/" + this.key + "/locations");
//                         expect(this.data).toEqual(null);
//                         expect(subject.ref().child("locations").getData()[this.key1]).toBeTruthy();
//                         expect(subject.ref().child("locations").getData()[this.key2]).toBeTruthy();
//                         expect(subject.path()).toEqual(rootPath + "/trips/" + this.key);
//                     });
//                     qReject(0);
//                 });
//                 describe("remove()", function() {
//                     beforeEach(function() {
//                         this.idxKeys = Object.keys(subject.ref().child("locations").getData());
//                         test = subject.remove(this.key);
//                         $rootScope.$digest();
//                         flush();
//                         flush();
//                     });
//                     it("should call geofire.remove() once", function() {
//                         expect(geofire.remove.calls.count()).toEqual(1);
//                     });
//                     it("should call remove on geofire with keys from main location index", function() {
//                         expect(geofire.remove.calls.argsFor(0)[0]).toEqual(addArr);
//                     });
//                     it("should remove the data from firebase", function() {
//                         expect(subject.ref().getData()).toEqual(null);
//                     });
//                     it("should return the firebaseRef from the removed record", function() {
//                         expect(subject.path()).toEqual(rootPath + "/trips/" + this.key);
//                     });
//                     it("should call user.removeIndex() with correct key", function() {
//                         expect(user.removeIndex).toHaveBeenCalledWith(null, 'trips', this.key);
//                     });
//                     qReject(0);
//                 });

//             });
//         });



//         function updateCheck() {
//             it("should save new time for updatedAt", function() {
//                 expect(getPromValue(test).getData().updatedAt).toEqual(jasmine.any(Number));
//                 expect(getPromValue(test).getData().updatedAt).not.toEqual(this.updateTime);
//             });
//             it("should not changed createdAt", function() {
//                 expect(getPromValue(test).getData().createdAt).toEqual(this.createTime);
//             });
//         }

//         function createCheck() {
//             it("should add createdAt and updatedAt properties", function() {
//                 expect(subject.ref().getData().createdAt).toEqual(jasmine.any(Number));
//                 expect(subject.ref().getData().updatedAt).toEqual(jasmine.any(Number));
//             });
//         }

//         function fq(ref) {
//             return ref.getFlushQueue();
//         }

//         function wrapPromise(p) {
//             return p.then(success, failure);
//         }

//         function getPromValue(obj) {
//             return obj.$$state.value;
//         }

//         function pathCheck(path, flag) {
//             var root = "https://your-firebase.firebaseio.com/";
//             if (flag === true) {
//                 return expect(subject.ref().path).toEqual(root.concat(path));
//             } else {
//                 it("should set the correct ref with childPath: " + path, function() {
//                     expect(subject.ref().path).toEqual(root.concat(path));
//                 });
//             }
//         }

//         function refCheck(path, flag) {
//             if (flag === true) {
//                 return expect(subject.ref()).toEqual("as");
//             } else {
//                 it("should set the correct ref with childPath: " + path, function() {
//                     expect(subject.ref()).toEqual("as");
//                 });
//             }
//         }

//         function baseCheck(type, val, id) {
//             switch (type) {
//                 case "object":
//                     expect(val).toEqual(jasmine.objectContaining({
//                         $id: id,
//                         $priority: null,
//                         $ref: jasmine.any(Function),
//                         $value: null
//                     }));
//                     break;
//                 case "array":
//                     expect(val).toEqual(jasmine.objectContaining({
//                         $keyAt: jasmine.any(Function),
//                         $indexFor: jasmine.any(Function),
//                         $remove: jasmine.any(Function),
//                         $getRecord: jasmine.any(Function),
//                         $add: jasmine.any(Function),
//                         $watch: jasmine.any(Function)
//                     }));
//                     break;
//             }
//         }

//         function logContains(message) {
//             it("should call $log.info with " + message, function() {
//                 var logArray = $log.info.calls.allArgs();
//                 var flatLog = logArray.reduce(function(x, y) {
//                     return x.concat(y);
//                 }, []);
//                 expect(flatLog.indexOf(message)).toBeGreaterThan(-1);
//             });
//         }

//         function logCount(x, flag) {
//             if (flag === true) {
//                 return expect($log.info.calls.count()).toEqual(x);
//             } else {
//                 it("should call $log.info " + x + " times", function() {
//                     expect($log.info.calls.count()).toEqual(x);
//                 });
//             }
//         }

//         function testCheck(x, flag) {
//             if (flag === true) {
//                 return expect(test).toEqual(x);
//             } else {
//                 it("should work", function() {
//                     expect(test).toEqual(x);
//                 });
//             }
//         }

//         function logCheck(x, flag) {
//             if (flag === true) {
//                 return expect($log.info.calls.allArgs()).toEqual(x);
//             } else {
//                 it("should log:" + x, function() {
//                     expect($log.info.calls.allArgs()).toEqual(x);
//                 });
//             }
//         }

//         function logNum(x, message, flag) {
//             if (flag === true) {
//                 return expect($log.info.calls.argsFor(x)).toEqual(message);
//             } else {
//                 it("should log:" + message, function() {
//                     expect($log.info.calls.argsFor(x)).toEqual(message);
//                 });
//             }
//         }

//         function qReject(x, flag) {
//             if (flag === true) {
//                 expect($q.reject.calls.allArgs()).toEqual([]);
//                 expect($q.reject.calls.count()).toEqual(x);
//             } else {
//                 it("should call $q.reject " + x + " times", function() {
//                     expect($q.reject.calls.allArgs()).toEqual([]);
//                     expect($q.reject.calls.count()).toEqual(x);
//                 });
//             }

//         }


//         function useParentRef() {
//             it("should construct firebase from parentRef", function() {
//                 logContains("Using parent");
//             });
//         }

//         function useCurrentRef() {
//             it("should reuse ref", function() {
//                 logContains("Reusing ref");
//             });
//         }

//         function inspect(x) {
//             if (angular.isObject(x)) {
//                 it("should be inspected", function() {
//                     expect(x.inspect()).toEqual("inspect!");
//                 });
//             } else {
//                 it("should be inspected", function() {
//                     expect(subject.inspect()).toEqual("inspect!");
//                 });

//             }
//         }

//         function subject(x) {
//             if (angular.isObject(x)) {
//                 it("should be the subject", function() {
//                     expect(x).toEqual("subject!");
//                 });
//             } else {
//                 it("should be the subject", function() {
//                     expect(subject.inspect()).toEqual("heres the subject!");
//                 });

//             }
//         }


//         function dataKeys(ref) {
//             return Object.keys(ref.getData());
//         }

//         function childKeys(node) {
//             if (!node) {
//                 return Object.keys(subject.ref().children);
//             } else {
//                 return Object.keys(subject.ref().child(node).getData());
//             }
//         }


//         function flush() {
//             $rootScope.$digest();
//             subject.ref().flush();
//             $rootScope.$digest();
//         }

//         function flushTime() {
//             $rootScope.$digest();
//             $timeout.flush();
//             subject.ref().flush();
//             $rootScope.$digest();
//         }

//         function extendMockFb(obj) {
//             var querySpy = {
//                 startAt: function() {
//                     return {
//                         endAt: function() {
//                             return {
//                                 on: function() {}
//                             }

//                         }
//                     }
//                 },
//             };
//             var extension = {
//                 orderByChild: jasmine.createSpy("child").and.returnValue(querySpy)
//             };
//             angular.extend(obj, extension);
//             return obj;
//         }


//         //from angularFire repo
//         var flushAll = (function() {
//             return function flushAll() {
//                 Array.prototype.slice.call(arguments, 0).forEach(function(o) {
//                     o.flush();
//                 });
//                 try {
//                     $timeout.flush();
//                 } catch (e) {}
//             }
//         })();


//     });


// })();
