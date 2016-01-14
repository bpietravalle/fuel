(function() {
    "use strict";

    describe("GeoQueries", function() {
        var subject, fuel, rootPath, $rootScope, test, mock;

        beforeEach(function() {
            rootPath = "https://your-firebase.firebaseio.com";
            module('firebase.fuel',
                function($provide) {
                    $provide.factory("firePath", function() {
                        return jasmine.createSpy("firePath").and.callFake(function() {
                            return {
                                ref: function() {},
                                makeGeofire: function() {
                                    mock = new MockFirebase(rootPath);
                                    // mock = mock.child(str);
                                    return new GeoFire(extend(mock));

                                }
                            };
                        });

                    });
                })
            inject(function(_fuel_, _$rootScope_) {
                fuel = _fuel_;
								$rootScope = _$rootScope_;
                // firePath = _firePath_;
            });

            subject = fuel("trips", {
                geofire: true
            });

            test = subject.query({
                center: [90, 100],
                radius: 10
            });
            $rootScope.$digest();
            // $timeout.flush();
        });
        it("should be a promise", function() {
            expect(test).toBeAPromise();
        });
        it("should return a array", function() {
            expect(getPromValue(test)).toBeAn('array');
        });
        it("should return a geofire obj as first arg in array", function() {
            expect(getPromValue(test)[0]).toEqual(jasmine.objectContaining({
                set: jasmine.any(Function),
                get: jasmine.any(Function),
                remove: jasmine.any(Function),
                query: jasmine.any(Function)
            }));
        });
        it("should return a geoQuery as 2nd arg in returned array", function() {
            expect(getPromValue(test)[1]).toEqual(jasmine.objectContaining({
                updateCriteria: jasmine.any(Function),
                radius: jasmine.any(Function),
                center: jasmine.any(Function),
                cancel: jasmine.any(Function),
                on: jasmine.any(Function)
            }));
        });

        function getPromValue(obj) {
            return obj.$$state.value;
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
