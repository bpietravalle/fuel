(function() {
    "use strict";
    describe("FireStarter-Geo", function() {
    //     var geo, session, userId, geoQuery, testutils, base, fireStarter, baseBuilder, spy, STUB_DATA, $timeout, result, $log, failure, gfPath, NEW_DATA, location, radius, $rootScope, $q, gfSpy, deferred, $provide, ref, data, key, field, coords,
    //         objMock, deferred, rec, newRecord, arrMock1, locData, firePath, fullLocData, newData, test, test1, arrData, sessionSpy, fsMocks, arrMock, objMock, geo, $rootScope, data, location, $injector, inflector, fsType, geoSpy, fsPath, options, fbObject, fbArray, pathSpy, $provide, fireEntity, subject, path, fireStarter, $q, $log;

    //     var success, failure;
    //     STUB_DATA = {
    //         "a": {
    //             "g": "keyA",
    //             "1": {
    //                 "0": 90,
    //                 "1": 50
    //             }
    //         },
    //         "b": {
    //             "g": "keyB",
    //             "1": {
    //                 "0": 30,
    //                 "1": 60
    //             }
    //         },
    //         "c": {
    //             "g": "keyC",
    //             "1": {
    //                 "0": -70,
    //                 "1": 150
    //             }
    //         }
    //     };
    //     NEW_DATA = {
    //         "d": {
    //             "g": "keyD",
    //             "1": {
    //                 "0": 20,
    //                 "1": -180
    //             }
    //         },
    //         "e": {
    //             "g": "keyE",
    //             "1": {
    //                 "0": 40,
    //                 "1": -100
    //             }
    //         }
    //     };


    //     location = {
    //         a: [90, 150],
    //         b: [50, 100]
    //     };
    //     key = "a_string";
    //     coords = location.a;
    //     radius = 0.1;
    //     data = {
    //         center: coords,
    //         radius: radius
    //     };
    //     beforeEach(function() {});


    //     beforeEach(function() {
    //         arrData = [{
    //             phone: "123456890",
    //             firstName: "tom"
    //         }, {
    //             phone: "0987654321",
    //             firstName: "frank"
    //         }];

    //         newData = {
    //             phone: "111222333",
    //             key: function() {
    //                 return "key";
    //             },
    //             firstName: "sally"
    //         };

    //         locData = [{
    //             lat: 90,
    //             lon: 100,
    //             place_id: "string",
    //             placeType: "a place",
    //             distance: 1234,
    //             closeBy: true
    //         }, {
    //             lat: 45,
    //             lon: 100,
    //             place_id: "different_place",
    //             placeType: "some place",
    //             distance: 1000,
    //             closeBy: false
    //         }];

    //         newRecord = {
    //             phone: "111222333",
    //             firstName: "sally"
    //         };

    //         MockFirebase.override();
    //         angular.module("fireStarter.services")
    //             .factory("session", function() {
    //                 return {
    //                     getId: jasmine.createSpy("getId").and.callFake(function() {
    //                         userId = '1';
    //                         return userId;
    //                     })
    //                 }
    //             });
    //         module("testutils");
    //         module("fbMocks");
    //         module("fireStarter.services");
    //         inject(function(_firePath_, _testutils_, _baseBuilder_, _fsMocks_, _session_, _$rootScope_, _fireEntity_, _inflector_, _fireStarter_, _$q_, _$log_, _$timeout_) {
    //             testutils = _testutils_;
    //             session = _session_;
    //             $timeout = _$timeout_;
    //             baseBuilder = _baseBuilder_;
    //             $rootScope = _$rootScope_;
    //             fsMocks = _fsMocks_;
    //             arrMock = fsMocks.fbArray(arrData);
    //             inflector = _inflector_;
    //             firePath = _firePath_;
    //             fireEntity = _fireEntity_;
    //             fireStarter = _fireStarter_;
    //             $q = _$q_;
    //             $log = _$log_;
    //         });
    //         geoSpy = jasmine.createSpyObj("geoSpy", ["get", "set", "remove", "distance"]);
    //         spyOn($log, "info").and.callThrough();
    //         spyOn($q, "reject").and.callThrough();
    //         options = {
    //             geofire: true,
    //             user: true
    //         };
    //         subject = fireEntity("requests", options);
    //         key = "a_key";
    //         gfPath = ["geofield"];
    //         ref = stubRef(gfPath);
    //         geo = makeGeo(STUB_DATA, ref, true);
    //         success = jasmine.createSpy('success');
    //         failure = jasmine.createSpy('failure');
    //     });
    //     afterEach(function() {
    //         geo = null;
    //         ref = null;
    //         locData = null;
    //         newRecord = null;
    //         newData = null;
    //         arrData = null;
    //         subject = null;
    //         arrMock = null;
    //         pathSpy = null;
    //         firePath = null;
    //         fireEntity = null;
    //         fireStarter = null;

    //     });

    //     it("factory instance should have all geofire methods", function() {
    //         expect(geo).toEqual(jasmine.objectContaining({
    //             distance: jasmine.any(Function),
    //             get: jasmine.any(Function),
    //             set: jasmine.any(Function),
    //             remove: jasmine.any(Function),
    //             query: jasmine.any(Function),
    //         }));
    //     });

    //     describe("Properties that don't return a promise", function() {

    //         describe("Path", function() {
    //             it("should equal the constructor's argument", function() {
    //                 var path = "Mock://" + gfPath;
    //                 expect(geo.path()).toEqual(path);
    //             });
    //         });
    //         describe("Ref", function() {
    //             it("should equal a firebase reference", function() {
    //                 expect(geo.ref()).toEqual(ref);
    //             });
    //         });
    //     });

    //     describe("main geofire functions -with spies", function() {
    //         beforeEach(function() {
    //             gfSpy = jasmine.createSpyObj("spy", ["get", "set", "ref", "remove", "distance", "query"]);
    //             spyOn(baseBuilder, "init").and.returnValue(gfSpy);
    //             geo = makeGeo(null, ref, true);
    //             $rootScope.$digest();
    //             spyOn($q, "when").and.callThrough();
    //         });

    //         var methods = [
    //             ["get", [key]],
    //             ["set", [key, coords]],
    //             ["ref"],
    //             ["remove", [key]],
    //             ["distance", [location.a, location.b]],
    //             ["query", [data]]
    //         ];

    //         function testMethods(y) {
    //             describe(y[0], function() {
    //                 if (y[0] === "ref" || y[0] === "distance" || y[0] === "query") {
    //                     it("should not be a promise", function() {
    //                         expect(geo[y[0]]).not.toBeAPromise();
    //                     });
    //                 } else {
    //                     it("should be a promise", function() {
    //                         expect(geo[y[0]]()).toBeAPromise();
    //                     });
    //                 }

    //                 it("should send: " + y[0] + ". to geofire object", function() {
    //                     geo[y[0]]();
    //                     $rootScope.$digest();
    //                     expect(gfSpy[y[0]]).toHaveBeenCalled();
    //                 });
    //                 it("should not call $q.reject", function() {
    //                     expect($q.reject).not.toHaveBeenCalled();
    //                 });

    //                 if (y[0] !== "ref") {
    //                     it("should call: " + y[0] + ". with: " + y[1], function() {
    //                         if (y[1].length === 1) {
    //                             geo[y[0]](y[1][0])
    //                             $rootScope.$digest();
    //                             expect(gfSpy[y[0]]).toHaveBeenCalledWith(y[1][0]);
    //                         } else {
    //                             geo[y[0]](y[1][0], y[1][0])
    //                             $rootScope.$digest();
    //                             expect(gfSpy[y[0]]).toHaveBeenCalledWith(y[1][0], y[1][0]);

    //                         }
    //                     });
    //                 }
    //             });
    //         }
    //         methods.forEach(testMethods);
    //     });
    //     describe("return values", function() {
    //         beforeEach(function() {
    //             ref = stubRef(["path"]);
    //             geo = fireStarter("geo", ref, true);
    //         });
    //         describe("set", function() {
    //             it("should add the key and coordinates to firebase", function() {
    //                 geo.set("string", [90, 100]);
    //                 ref.flush();
    //                 $rootScope.$digest();
    //                 expect(geo.ref()['data']).toEqual(jasmine.objectContaining({
    //                     string: {
    //                         g: jasmine.any(String),
    //                         "l": [90, 100]
    //                     }
    //                 }));
    //             });
    //         });
    //         describe("get", function() {
    //             it("should return the resolved value", function() {
    //                 geo.set("string", [90, 100]);
    //                 ref.flush();
    //                 geo.set("different", [40, 100]);
    //                 ref.flush();
    //                 $rootScope.$digest();
    //                 var test = geo.get("string");
    //                 $rootScope.$digest();
    //                 ref.flush();
    //                 wrapPromise(test);
    //                 getDeferred(test).resolve("success");
    //                 $rootScope.$digest();
    //                 expect(promiseStatus(test)).toEqual(0); //this is the wrap i think
    //                 expect(deferredStatus(test)).toEqual(1);
    //                 $rootScope.$digest();
    //                 $rootScope.$digest();
    //                 expect(deferredValue(test)).toEqual("success");
    //             });
    //         });
    //         describe("remove", function() {
    //             it("should remove the corred record", function() {
    //                 geo.set("string", [90, 100]);
    //                 ref.flush();
    //                 geo.set("different", [40, 100]);
    //                 ref.flush();
    //                 $rootScope.$digest();
    //                 $rootScope.$digest();
    //                 expect(getRefResult(geo)["different"]).toBeDefined();
    //                 expect(getRefResult(geo)["string"]).toBeDefined();
    //                 geo.remove("string");
    //                 ref.flush();
    //                 $rootScope.$digest();
    //                 expect(getRefResult(geo)["different"]).toBeDefined();
    //                 expect(getRefResult(geo)["string"]).not.toBeDefined();

    //             });
    //         });


    //         describe("geoQuery", function() {
    //             beforeEach(function() {
    //                 spy = {
    //                     query: function() {
    //                         gfSpy = jasmine.createSpyObj("geoQuerySpy", ["center", "cancel", "radius", "updateCriteria", "on", "remove"]);
    //                         return gfSpy;
    //                     }
    //                 }
    //                 spyOn(baseBuilder, "init").and.returnValue(spy);
    //                 geo = makeGeo(null, ref, true);
    //                 geoQuery = geo.query(data);
    //                 $rootScope.$digest();
    //             });
    //             it("should have all geofire functions", function() {
    //                 expect(geoQuery.$$state.value).toEqual(jasmine.objectContaining({
    //                     center: jasmine.any(Function),
    //                     remove: jasmine.any(Function),
    //                     radius: jasmine.any(Function),
    //                     on: jasmine.any(Function),
    //                     cancel: jasmine.any(Function),
    //                     updateCriteria: jasmine.any(Function)
    //                 }));
    //             });

    //             var qMeth = ["center", "radius", "updateCriteria", "on", "cancel", "remove"];

    //             function queryMethods(y) {
    //                 it("should call " + y + " on the geoQuery", function() {
    //                     $rootScope.$digest();
    //                     var test = geoQuery.$$state.value
    //                     test[y]();
    //                     expect(gfSpy[y]).toHaveBeenCalled();
    //                 });

    //             }
    //             qMeth.forEach(queryMethods);
    //         });

    //         function wrapPromise(p) {
    //             return p.then(success, failure);
    //         }
    //     });


    //     function stubRef(path) {
    //         var mockPath = path.join('/');
    //         return new MockFirebase('Mock://').child(mockPath);
    //     }

    //     function makeGeo(initialData, path, flag) {

    //         if (!path) {
    //             path = stubRef();
    //             flag = true;
    //         }

    //         var geo = fireStarter("geo", path, flag);

    //         if (initialData) {
    //             //TODO: should set with geofire
    //             geo.ref().set(initialData);
    //             geo.ref().flush();
    //         }
    //         return geo;
    //     }


    //     function arrCount(arr) {
    //         return arr.base().ref().length;
    //     }

    //     function getRefResult(obj) {
    //         return obj.ref()['data'];
    //     }

    //     function getRefData(obj) {
    //         return obj['data'];
    //     }

    //     function getPromValue(obj, flag) {
    //         if (flag === true) {
    //             return obj.$$state.value['data'];
    //         } else {
    //             return obj.$$state.value;
    //         }
    //     }

    //     function getDeferred(obj) {
    //         return obj.$$state.pending[0][0];
    //     }

    //     function promiseStatus(obj) {
    //         return obj.$$state.status;
    //     }

    //     function deferredStatus(obj) {
    //         return obj.$$state.pending[0][0].promise.$$state.status;
    //     }

    //     function deferredValue(obj) {
    //         return obj.$$state.pending[0][0].promise.$$state.value; //.value;
    //     }


    });
})();
