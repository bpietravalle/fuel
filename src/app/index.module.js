(function() {
    'use strict';

    angular
        .module('firebase.fuel', ['firebase.fuel.config', 'firebase.fuel.services']);

    angular
        .module('firebase.fuel.services', ['firebase.fuel.utils','firebase.fuel.logger', 'firebase.fuel.config']);

})();
