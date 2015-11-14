(function() {
  'use strict';

  angular
    .module('firebase.fuel')
    .config(config);

  /** @ngInject */
  function config($logProvider) {

    $logProvider.debugEnabled(true);

  }

})();
