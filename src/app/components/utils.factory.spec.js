(function() {
    "use strict";

    describe("Utils factory", function() {
        var $q, utils, inflector, $log, data, test, rootPath, main;

        beforeEach(function() {
            module("firebase.fuel.utils");
            inject(function(_utils_, _inflector_, _$log_, _$q_) {
                $log = _$log_;
                inflector = _inflector_;
                $q = _$q_;
                utils = _utils_;
            });
            spyOn($log, "info");
            rootPath = "https://your-firebase.firebaseio.com";
            main = rootPath + "/" + "trips";
            spyOn($q, "reject")
        });
        describe("paramCheck", function() {
            it("should return default if param arg is undefined", function() {
                test = utils.paramCheck(undefined, "str", "default");
                expect(test).toEqual("default");
            });

            var params = [
                ["str", "aString", 12312, "string"],
                ["bool", true, {}, "boolean"],
                ["arr", ["array", "of", "data"], true, "array"]
            ];

            function paramCheck(y) {
                it("should return param if it is a " + y[3], function() {
                    test = utils.paramCheck(y[1], y[0], "default");
                    expect(test).toEqual(y[1]);
                });
                it("should call $q.reject if param is not a " + y[3], function() {
                    expect(function() {
                        utils.paramCheck(y[2], y[0], "default");
                    }).toThrow();
                    // expect($q.reject).toHaveBeenCalled();
                });
            }
            params.forEach(paramCheck);
        });

        describe("toArray()", function() {
            it("should add param to new array", function() {
                test = utils.toArray("string");
                expect(test).toEqual(["string"]);
            });
            it("should flatten param if its an array", function() {
                test = utils.toArray(["string", ["another", "string"]]);
                expect(test).toEqual(["string", "another", "string"]);
            });
        });
        describe("stringify()", function() {
            it("should return the param if it isn't an array", function() {
                test = utils.stringify("string");
                expect(test).toEqual("string");
            });
            it("should join the array items with '/' if param is an array", function() {
                test = utils.stringify(["string", "another", "string"]);
                expect(test).toEqual("string/another/string");
            });

        });
        describe("removeSlash", function() {
            it("should remove trailing slash", function() {
                var trail = main + "/";
                test = utils.removeSlash(trail);
                expect(test).toEqual(main);
            });
            it("should remove leading slash", function() {
                var lead = "/" + main;
                test = utils.removeSlash(lead);
                expect(test).toEqual(main);
            });
        });
        describe("extendPath()", function() {
            it("should remove undefined item from end", function() {
                var t = utils.extendPath(["trips"], ["id", undefined]);
                expect(t.length).toEqual(2);
            });
        });
        describe("addTimeAtCreate", function() {
            beforeEach(function() {
                data = {
                    name: "frank",
                    age: 45,
                    occupation: 'plumber'
                };
                test = utils.addTimeAtCreate(data, "createdAt", "updatedAt");
            });
            it("should add createTime and updateTime", function() {
                expect(data.createdAt).toEqual({
                    ".sv": "timestamp"
                });
                expect(data.updatedAt).toEqual({
                    ".sv": "timestamp"
                });
            });
            it("should return the data object with timestamp", function() {
                expect(test).toEqual({
                    name: "frank",
                    age: 45,
                    occupation: 'plumber',
                    createdAt: {
                        ".sv": "timestamp"
                    },
                    updatedAt: {
                        ".sv": "timestamp"
                    }
                });
            });
        });
        describe("addTimeAtSave", function() {
            beforeEach(function() {
                data = {
                    name: "frank",
                    age: 45,
                    occupation: 'plumber'
                };
                test = utils.addTimeAtSave(data, "updatedAt");
            });
            it("should add updateTime", function() {
                expect(data.updatedAt).toEqual({
                    ".sv": "timestamp"
                });
            });
            it("should not add createTime", function() {
                expect(data.createdAt).not.toBeDefined();
            });
            it("should return the data object with timestamp", function() {
                expect(test).toEqual({
                    name: "frank",
                    age: 45,
                    occupation: 'plumber',
                    updatedAt: {
                        ".sv": "timestamp"
                    }
                });
            });
        });
        describe("standardError", function() {
            it("should call $q.reject with error message", function() {
                utils.standardError("error");
                expect($q.reject).toHaveBeenCalledWith("error");
            });
        });

        var meths = [
            ["pluralize", "user"],
            ["singularize", "users"],
            ["camelize", "new_phone"]
        ];

        function inflectorTest(y) {
            describe(y[0], function() {
                beforeEach(function() {
                    spyOn(inflector, y[0]);
                });
                it("should call inflector." + y[0] + "()", function() {
                    utils[y[0]](y[1]);
                    expect(inflector[y[0]].calls.argsFor(0)[0]).toEqual(y[1]);
                });
            });
        }
        meths.forEach(inflectorTest);
    });

})();
