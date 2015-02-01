'use strict';

angular.module('clientApp').directive('strengthScore', function () {
  return {
    restrict: 'E',
    scope: {user: '='},
    templateUrl: 'views/strength-score.html',
    controller: function ($scope, MojoServer, WorkoutState, UserState, $location) {
      $scope.userStatus = MojoServer.getUserStatus();

      $scope.$watch('user.stats', function (newVal) {
        $scope.data = newVal.strengthScore;
      }, false);


      $scope.editWeight = function() {
        var dt = _.last($scope.user.data).date;
        WorkoutState.setWeightDate(dt);
        $location.path('/trackweight');
      }

      $scope.canEdit = function() {
        return ($scope.user.userId === $scope.userStatus.id) || ($scope.user.userId === $scope.userStatus.username);
      };

      $scope.noWeight = ! _.last($scope.user.data).body.weight;
    }
  };
});

angular.module('clientApp')
  .controller('ScoreController', function ($scope) {
    $scope.user = UserState.getMyState();

  });