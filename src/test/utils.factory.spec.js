(function() {
    "use strict";

    describe("Utils factory", function() {
        var utils, $q, rootPath;

        beforeEach(function() {
            module("firebase.fuel");
            inject(function(_utils_, _$q_) {
                utils = _utils_;
                $q = _$q_;
            });
            rootPath = "https://your-firebase.firebaseio.com";
        });
        describe("extendPath()", function() {
            it("should remove undefined item from end", function() {
                var t = utils.extendPath(["trips"], ["id", undefined]);
                expect(t.length).toEqual(2);

            });


        });






    });

})();
