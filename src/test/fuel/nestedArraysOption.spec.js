// (function() {
//     "use strict";

//     describe("Fuel Factory", function() {
//         var firePath, differentLocation, phones, phone, geofire, differentSession, keyMock, location, $timeout, arrData, newData, newRecord, test1, session, lastRecs, recRemoved, rootPath, copy, keys, testutils, root, success, failure, recAdded, sessionSpy, locData, userId, maSpy, maSpy1, mrSpy, naSpy, nrSpy, fsMocks, geo, test, ref, objRef, objCount, arrCount, arrRef, $rootScope, data, user, location, locationSpy, $injector, inflector, fsType, userSpy, fsPath, options, fbObject, fbArray, pathSpy, $provide, fuel, subject, path, fireStarter, $q, $log;

//         beforeEach(function() {
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
//                 .factory("location", function($q) {
//                     var location = {
//                         addLoc: keyMock("add", $q),
//                         removeLoc: keyMock("remove", $q),

//                     };

//                     return location;

//                 })
//                 .factory("differentLocation", function($q) {
//                     var location = {
//                         addLoc: function(path, data, flag) {
//                             if (flag === true) {
//                                 delete data.lat;
//                                 delete data.lon;
//                             }
//                             ref = new MockFirebase("locations")
//                             ref.set(data);
//                             ref.flush();
//                             return ref;
//                         }

//                     };

//                     return location;

//                 })
//                 .factory("geofire", function($q) {
//                     var geofire = {
//                         set: keyMock("set", $q),
//                         remove: keyMock("remove", $q),
//                         get: keyMock("get", $q),

//                     };

//                     return geofire;

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
//                 //just making sure nested array methods dont confuse
//                 //injected services
//                 .factory("phone", function() {
//                     return {
//                         getId: function() {}
//                     }
//                 })
//                 .factory("phones", function() {
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

//             inject(function(_user_, _phones_, _differentLocation_, _phone_, _testutils_, _differentSession_, _location_, _geofire_, _$timeout_, _$log_, _firePath_, _session_, _$rootScope_, _fuel_, _inflector_, _fireStarter_, _$q_) {
//                 differentLocation = _differentLocation_;
//                 differentSession = _differentSession_;
//                 phones = _phones_;
//                 phone = _phone_;
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

//         describe("Nested Arrays", function() {
//             beforeEach(function() {
//                 test = null;
//                 this.data = {
//                     name: "frank",
//                     age: 30,
//                     city: "Boston"
//                 };
//                 this.newPhone = [{
//                     number: "123456",
//                     type: "cell",
//                     valid: true
//                 }, {
//                     number: "098765",
//                     type: "rotary",
//                     valid: false
//                 }];
//                 subject = fuel("users", {
//                     nestedArrays: ["phones", "emails"],
//                     session: true,
//                 });
//                 $rootScope.$digest();
//                 subject.add(this.data);
//                 flush();
//                 this.userId = subject.ref().key();
//                 spyOn(session, "getId").and.returnValue(this.userId);
//             });
//             afterEach(function() {
//                 test = null;
//             });

//             var methods = ["addPhone", "removePhone", "loadPhone", "savePhone", "getPhone", "loadPhones", "phone", "phones"];

//             function nestedArr(x) {
//                 it(x + " should be defined", function() {
//                     expect(subject[x]).toBeDefined();
//                 });
//             }
//             methods.forEach(nestedArr);
//             it("simple checks on setup", function() {
//                 expect(subject.ref().getData()).toEqual({
//                     name: "frank",
//                     age: 30,
//                     city: "Boston"
//                 });
//                 expect(this.userId).not.toEqual("users");
//                 expect(this.userId).toEqual(jasmine.any(String));
//             });
//             describe("Queries", function() {
//                 beforeEach(function() {
//                     subject.ref().child("phones").push(this.newPhone[0])
//                     subject.ref().flush();
//                     subject.ref().child("phones").push(this.newPhone[1])
//                     subject.ref().flush();
//                 });
//                 describe("nestedArray method", function() {
//                     beforeEach(function() {
//                         test = subject.phones();
//                         flush();
//                         this.key1 = childKeys()[0];
//                         this.key2 = childKeys()[1];
//                     });
//                     it("should add sessionId() if available as mainRecId", function() {
//                         expect(subject.path().search(this.userId)).not.toEqual(-1);
//                     });
//                     it("should be a promise", function() {
//                         expect(test).toBeAPromise();
//                     });
//                     it("should resolve to a firebaseArray", function() {
//                         baseCheck("array", getPromValue(test));
//                     });
//                     it("should have correct path", function() {
//                         expect(getPromValue(test).$ref().toString()).toEqual(rootPath + "/users/" + this.userId + "/phones");
//                     });
//                     it("should update the currentRef", function() {
//                         expect(childKeys()).toEqual([this.key1, this.key2]);
//                     });
//                     it("should have correct length", function() {
//                         expect(getPromValue(test).length).toEqual(2);
//                     });
//                     qReject(0);
//                 });
//                 describe("nestedRecord method", function() {
//                     beforeEach(function() {
//                         test = subject.phone(1);
//                         flush();
//                         this.id = subject.ref().key();
//                     });

//                     it("should throw error if no recId is provided", function() {
//                         expect(function() {
//                             subject.phone();
//                             flush();
//                         }).toThrow();
//                     });
//                     it("should return a promise", function() {
//                         expect(test).toBeAPromise();
//                     });
//                     it("should resolve to a firebaseObject", function() {
//                         expect(getPromValue(test)).toEqual(jasmine.objectContaining({
//                             $id: this.id,
//                             $priority: null,
//                             $ref: jasmine.any(Function)
//                         }))
//                         expect(this.id).toEqual('1');
//                     });

//                     it("should have correct path", function() {
//                         expect(getPromValue(test).$ref().toString()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + this.id);
//                     });
//                     it("should update the currentRef", function() {
//                         expect(subject.path()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + this.id);
//                         expect(this.id).not.toEqual("phones");

//                     });
//                     it("parent array should be correct length", function() {
//                         expect(dataKeys(getPromValue(test).$ref().parent()).length).toEqual(2);
//                     });
//                     qReject(0);
//                 });

//                 describe("getPhone", function() {
//                     beforeEach(function() {

//                         this.key1 = childKeys("phones")[0];
//                         this.key2 = childKeys("phones")[1];
//                         test = subject.getPhone(this.key1);
//                         //if use flush() then getRecord wont find key;
//                         flushAll(subject.ref());
//                     });
//                     it("should return a promise", function() {
//                         expect(test).toBeAPromise();
//                     });
//                     it("should resolve to correct firebaseObject", function() {
//                         expect(getPromValue(test)).toEqual(jasmine.objectContaining({
//                             $id: this.key1,
//                             $priority: null,
//                             number: "123456",
//                             type: "cell",
//                             valid: true
//                         }))
//                         expect(this.key1).not.toEqual(this.key2);
//                     });
//                     it("should have correct key", function() {
//                         expect(getPromValue(test).$id).toEqual(this.key1);
//                     });
//                     it("should update currentRef to parentRef", function() {
//                         expect(subject.ref().key()).toEqual("phones");
//                         expect(childKeys()[0]).toEqual(this.key1);
//                     });
//                     it("parent array should be correct length", function() {
//                         expect(childKeys().length).toEqual(2);
//                     });
//                     logContains("setting ref to current parent");
//                     qReject(0);
//                 });
//                 describe("loadPhone", function() {
//                     beforeEach(function() {
//                         this.key1 = childKeys("phones")[0];
//                         this.key2 = childKeys("phones")[1];
//                         test = subject.loadPhone(this.key1);
//                         // flushAll(subject.ref());
//                         //flush works here: think the issue is the order of tasks and $indexFor()
//                         flush();
//                         this.refKey = getPromValue(test).$id;
//                     });
//                     it("should return a promise", function() {
//                         expect(test).toBeAPromise();
//                     });
//                     it("should resolve to a firebaseObject", function() {
//                         expect(getPromValue(test)).toEqual(jasmine.objectContaining({
//                             $id: this.key1,
//                             $priority: null,
//                             number: "123456",
//                             type: "cell",
//                             valid: true
//                         }))
//                         expect(this.key1).not.toEqual(this.key2);
//                     });
//                     it("should have correct key", function() {
//                         expect(subject.ref().key()).toEqual(this.key1);
//                         expect(this.refKey).toEqual(this.key1);
//                     });
//                     it("parent array should be correct length", function() {
//                         expect(dataKeys(subject.parent()).length).toEqual(2);
//                     });
//                     qReject(0);
//                     logContains("setting ref to current object ref");
//                 });
//                 describe("loadPhones", function() {
//                     beforeEach(function() {
//                         this.key1 = childKeys("phones")[0];
//                         this.key2 = childKeys("phones")[1];
//                         test = subject.loadPhones();
//                         flushAll(subject.ref());
//                         this.refKeys = getPromValue(test).$ref().getKeys();
//                     });
//                     it("should return a promise", function() {
//                         expect(test).toBeAPromise();
//                     });
//                     it("should resolve to a firebaseArray", function() {
//                         expect(getPromValue(test)).toEqual(jasmine.objectContaining({
//                             $add: jasmine.any(Function),
//                             $getRecord: jasmine.any(Function),
//                             $ref: jasmine.any(Function)
//                         }));
//                         expect(this.key1).not.toEqual(this.key2);
//                     });
//                     it("should have correct length", function() {
//                         expect(getPromValue(test).length).toEqual(2);
//                     });
//                     it("should have correct records", function() {
//                         expect(getPromValue(test)[0]).toEqual(jasmine.objectContaining(this.newPhone[0]));
//                         expect(getPromValue(test)[1]).toEqual(jasmine.objectContaining(this.newPhone[1]));
//                     });
//                     it("should have correct keys", function() {
//                         expect(this.refKeys[0]).toEqual(this.key1);
//                         expect(this.refKeys[1]).toEqual(this.key2);

//                     });
//                     it("should update the current ref", function() {
//                         expect(subject.ref().getKeys()[0]).toEqual(this.key1);
//                         expect(subject.ref().getData()[this.key1]).toEqual(this.newPhone[0]);
//                         expect(subject.ref().getKeys()[1]).toEqual(this.key2);
//                         expect(subject.ref().getData()[this.key2]).toEqual(this.newPhone[1]);
//                     });
//                     qReject(0);
//                     logContains("setting ref to current object ref");
//                 });
//             });
//             describe("Commands", function() {
//                 beforeEach(function() {
//                     test = subject.addPhone(this.newPhone[0]);
//                     flush();
//                     this.key = subject.ref().key();
//                 });
//                 describe("add()", function() {
//                     it("should add a record to the correct array", function() {
//                         expect(subject.ref().getData()).toEqual(this.newPhone[0]);
//                     });
//                     it("should have correct path", function() {
//                         expect(getPromValue(test).toString()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + this.key);
//                     });
//                     it("should update the currentRef", function() {
//                         expect(subject.path()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + this.key);
//                     });
//                     it("should resolve to a fireBaseRef", function() {
//                         expect(getPromValue(test)).toBeAFirebaseRef();
//                     });
//                     qReject(0);
//                 });
//                 describe("remove()", function() {
//                     beforeEach(function() {
//                         test = subject.removePhone(this.key);
//                         flush();
//                         this.key1 = subject.ref().key();
//                     });
//                     it("should remove the record to the correct array", function() {
//                         expect(subject.ref().getData()).toEqual(null);
//                     });
//                     it("should have correct path", function() {
//                         expect(this.key1).toEqual(this.key);
//                         expect(getPromValue(test).toString()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + this.key1);
//                     });
//                     it("should update the currentRef", function() {
//                         expect(this.key1).toEqual(this.key);
//                         expect(subject.path()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + this.key1);
//                     });
//                     it("should resolve to a fireBaseRef", function() {
//                         expect(getPromValue(test)).toBeAFirebaseRef();
//                     });
//                     qReject(0);
//                 });
//                 describe("save()", function() {
//                     beforeEach(function() {
//                         subject.base()[0].type = "landLine";
//                         subject.base()[0].number = "11223344";
//                         test = subject.savePhone([subject.base(), this.key]);
//                         flush();
//                         this.key1 = subject.ref().key();
//                     });
//                     it("should have correct path", function() {
//                         expect(this.key1).toEqual(this.key);
//                         expect(getPromValue(test).toString()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + this.key1);
//                     });
//                     it("should update the currentRef", function() {
//                         expect(this.key1).toEqual(this.key);
//                         expect(subject.path()).toEqual(rootPath + "/users/" + this.userId + "/phones/" + this.key1);
//                     });
//                     it("should update record", function() {
//                         expect(subject.ref().getData().type).toEqual("landLine");
//                         expect(subject.ref().getData().number).toEqual("11223344");
//                     });
//                     it("should resolve to a fireBaseRef", function() {
//                         expect(getPromValue(test)).toBeAFirebaseRef();
//                     });
//                     qReject(0);
//                 })
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
