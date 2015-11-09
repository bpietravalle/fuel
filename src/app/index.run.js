(function() {
  'use strict';

  angular
    .module('fuel')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }

})();
