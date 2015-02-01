'use strict';

angular.module('clientApp').directive('strengthScore', function () {
  return {
    restrict: 'E',
    scope: {user: '='},
    templateUrl: 'views/strength-score.html',
    controller: function ($scope) {

      $scope.$watch('user.stats', function (newVal) {
        $scope.data = newVal.strengthScore;
      }, false);

    }
  };
});
