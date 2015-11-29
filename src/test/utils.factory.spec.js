(function() {
    "use strict";

    describe("Utils factory", function() {
        var utils, $log, data, $q, test, rootPath, main, c, p;

        beforeEach(function() {
            module("firebase.fuel.utils");
            inject(function(_utils_, _$q_, _$log_) {
                $log = _$log_;
                utils = _utils_;
                $q = _$q_;
            });
            spyOn($log, "info");
            rootPath = "https://your-firebase.firebaseio.com";
            main = rootPath + "/" + "trips";
        });
        describe("extendPath()", function() {
            it("should remove undefined item from end", function() {
                var t = utils.extendPath(["trips"], ["id", undefined]);
                expect(t.length).toEqual(2);

            });
        });
        it("nodeIdx", function() {
            var path = rootPath + "trips/stuff/hotels/rooms";
            expect(utils.nodeIdx(path, main)).toEqual(["stuff", "hotels", "rooms"]);

        });
        describe("removeSlash", function() {
            it("should remove trailing", function() {
                var t = rootPath + "/";
                expect(utils.removeSlash(t)).toEqual(rootPath);
            });

        })
        describe("nextPath", function() {
            describe("when current === param", function() {
                beforeEach(function() {
                    this.c = ["states", "hotels"];
                    this.p = ["states", "hotels"];
                    test = utils.nextPath(this.c, this.p);
                });
                it("should return correct value", function() {
                    expect(test).toEqual([]);
                });

            });
            describe("when current === child", function() {
                beforeEach(function() {
                    this.c = ["states", "userId"];
                    this.p = ["states", "userId", "hotels"];
                    test = utils.nextPath(this.c, this.p);
                });
                it("should return correct value", function() {
                    expect(test).toEqual("hotels");
                });

            });
            describe("when current === parent", function() {
                beforeEach(function() {
                    this.c = ["states", "userId", "hotels", "east"];
                    this.p = ["states", "userId"];
                    test = utils.nextPath(this.c, this.p);
                });
                it("should return correct value", function() {
                    expect(test).toEqual([]);
                });

            });
        });
        describe("addTimeAtCreate", function() {
            beforeEach(function() {
                data = {
                    name: "frank",
                    age: 45,
                    occupation: 'plumber'
                };
                utils.addTimeAtCreate(data, "createdAt", "updatedAt");
            });
            it("should add createTime and updateTime", function() {
                expect(data.createdAt).toEqual({
                    ".sv": "timestamp"
                });
                expect(data.updatedAt).toEqual({
                    ".sv": "timestamp"
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
                utils.addTimeAtCreate(data, "updatedAt");
            });
            it("should add updateTime", function() {
                expect(data.updatedAt).toEqual({
                    ".sv": "timestamp"
                });
            });
						it("should not add createTime",function(){
							expect(data.createdAt).not.toBeDefined();
						});
        });





    });

})();
