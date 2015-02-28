'use strict';

angular.module('clientApp').directive('weightInput', function () {
  return {
    restrict: 'E',
    scope: {input: '=', unitedit:'@'},
    templateUrl: 'views/weight-input.html',
    controller: function () {

    }
  };
});
