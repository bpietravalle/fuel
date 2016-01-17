(function() {
    "use strict";

    describe("TimeStamp Option", function() {
        var spy, subject1, utils, $timeout, keyMock, ref, $rootScope, fuel, subject, $q, $log;

        beforeEach(function() {

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
                $provide.factory("differentSession", function() {
                    return {
                        differentMeth: function() {}
                    }
                });
            });


            inject(function(_$timeout_, _utils_, _$log_, _$rootScope_, _fuel_, _$q_) {
                $timeout = _$timeout_;
                utils = _utils_;
                $rootScope = _$rootScope_;
                fuel = _fuel_;
                $q = _$q_;
                $log = _$log_;
            });

            spyOn(utils, "addTimeAtCreate");
            spyOn($q, "reject").and.callThrough();
            spyOn($log, "info").and.callThrough();
            subject = fuel("trips", {
                timeStamp: true
            });
            subject1 = fuel("trips");
        });
        afterEach(function() {
            fuel = null;
        });

        describe("add()", function() {
            describe("With timeStamp Option", function() {
                beforeEach(function() {
                    subject.add("data");
                    $rootScope.$digest();
                    $timeout.flush();
                });
                createCheck("data");
            });
            describe("WithOut timeStamp Option", function() {
                it("should not call utils.addTimeAtCreate", function() {
                    subject1.add("data");
                    $rootScope.$digest();
                    $timeout.flush();
                    expect(utils.addTimeAtCreate).not.toHaveBeenCalled();
                });
            });
        });
        describe("save()", function() {
            var arrSpy;
            beforeEach(function() {
                spy = jasmine.createSpyObj("spy", ["$save"]);
                arrSpy = {
                    $save: function(obj) {
                        return extend(obj);
                    }
                };

                spyOn(utils, "addTimeAtSave").and.callFake(function(obj) {
                    return angular.extend(obj, {
                        $save: jasmine.createSpy("aftersave").and.callFake(function() {
                            return extend(obj);
                        })
                    });

                });
            });
            describe("With timeStamp Option", function() {
                describe("When passing object", function() {
                    it("should call utils.addTimeAtSave with data and update property", function() {
                        subject.save(spy);
                        expect(utils.addTimeAtSave.calls.argsFor(0)[0]).toEqual(spy);
                        expect(utils.addTimeAtSave.calls.argsFor(0)[1]).toEqual("updatedAt");
                    });
                });
                describe("When passing array", function() {
                    it("should call utils.addTimeAtSave with data and update property", function() {
                        subject.save([arrSpy, spy]);
                        expect(utils.addTimeAtSave.calls.argsFor(0)[0]).toEqual(spy);
                        expect(utils.addTimeAtSave.calls.argsFor(0)[1]).toEqual("updatedAt");
                    });
                });
            });
						describe("Without timeStamp Option",function(){
                describe("When passing object", function() {
                    // it("should not call utils.addTimeAtSave", function() {
                    //     subject1.save(spy);
                    //     expect(utils.addTimeAtSave).not.toHaveBeenCalled();
                    //     expect(utils.addTimeAtSave.calls.argsFor(0)[1]).toEqual("updatedAt");
                    // });
                });
                describe("When passing array", function() {
                    it("should not call utils.addTimeAtSave", function() {
                        subject1.save([arrSpy, spy]);
                        expect(utils.addTimeAtSave).not.toHaveBeenCalled();
                    });
                });

						});

        });

        function extend(obj) {
            return angular.extend(obj, {
                catch: jasmine.createSpy("aftersave")
            })
        }

        function createCheck(dt, num) {
            if (!num) {
                num = 0;
            }
            it("should call utils.addTimeAtCreate with data and time properties", function() {
                expect(utils.addTimeAtCreate.calls.argsFor(num)[0]).toEqual(dt);
                expect(utils.addTimeAtCreate.calls.argsFor(num)[1]).toEqual("createdAt");
                expect(utils.addTimeAtCreate.calls.argsFor(num)[2]).toEqual("updatedAt");
            });
        }


    });


})();
