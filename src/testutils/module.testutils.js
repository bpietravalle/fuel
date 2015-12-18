(function() {
    "use strict";

    angular.module('testutils', ['firebase'])
        .factory('testutils', function($firebaseUtils, $log) {
            var utils = {
                // FROM firebase/angularfire repo
                ref: ref,
                deepCopyObject: deepCopyObject,
                refSnap: refSnap,
                snap: snap,
                //below is my own mess
                getPromValue: getPromValue,
                subject: subject,
                inspect: inspect,
                currentBaseCheck: currentBaseCheck,
                currentRefCheck: currentRefCheck,
                lodash: lodash,
                testCheck: testCheck,
                logCount: logCount,
                logNum: logNum,
                logCheck: logCheck,
                logContains: logContains,
                qReject: qReject,
                returnsArray: returnsArray,
                useCurrentRef: useCurrentRef,
                useNewBase: useNewBase,
                useChildRef: useChildRef,
                useParentRef: useParentRef,
            };


            return utils;

            function lodash() {
                return window._;
            }

            function ref(key, base) {
                var ref = new MockFirebase().child(base || 'data');
                if (key) {
                    ref = ref.child(key);
                }
                return ref;
            }

            function deepCopyObject(obj) {
                var newCopy = angular.isArray(obj) ? obj.slice() : angular.extend({}, obj);
                for (var key in newCopy) {
                    if (newCopy.hasOwnProperty(key)) {
                        if (angular.isObject(newCopy[key])) {
                            newCopy[key] = utils.deepCopyObject(newCopy[key]);
                        }
                    }
                }
                return newCopy;
            }

            function snap(data, refKey, pri) {
                return utils.refSnap(utils.ref(refKey), data, pri);
            }

            function refSnap(ref, data, pri) {
                data = copySnapData(data);
                return {
                    ref: function() {
                        return ref;
                    },
                    val: function() {
                        return data;
                    },
                    getPriority: function() {
                        return angular.isDefined(pri) ? pri : null;
                    },
                    key: function() {
                        return ref.ref().key();
                    },
                    name: function() {
                        return ref.ref().key();
                    },
                    child: function(key) {
                        var childData = angular.isObject(data) && data.hasOwnProperty(key) ? data[key] : null;
                        return utils.fakeSnap(ref.child(key), childData, null);
                    }
                }
            }

            function copySnapData(obj) {
                if (!angular.isObject(obj)) {
                    return obj;
                }
                var copy = {};
                $firebaseUtils.each(obj, function(v, k) {
                    copy[k] = angular.isObject(v) ? utils.deepCopyObject(v) : v;
                });
                return copy;
            }


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

            function currentRefCheck(path, flag) {
                var root = "https://your-firebase.firebaseio.com/";
                if (flag === true) {
                    return expect(subject.currentRef().path).toEqual(root.concat(path));
                } else {
                    it("should set the correct currentRef with childPath: " + path, function() {
                        expect(subject.currentRef().path).toEqual(root.concat(path));
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


        });



})();
