'use strict';

angular.module('clientApp').directive('strengthScore', function () {
  return {
    restrict: 'E',
    scope: {user: '='},
    templateUrl: 'views/strength-score.html',
    controller: 'strengthScoreController'
  };
});


angular.module('clientApp').controller('strengthScoreController', function ($scope, MojoServer, WorkoutState, UserState, $location) {
  $scope.userStatus = MojoServer.getUserStatus();

  $scope.$watch('user.stats', function (newVal) {
    $scope.data = newVal.strengthScore;
  }, false);

  $scope.editWeight = function() {
    var dt = _.last($scope.user.data).date;
    WorkoutState.setWeightDate(dt);
    $location.path('/trackweight');
  };

  $scope.canEdit = function() {
    return ($scope.user.userId === $scope.userStatus.id) || ($scope.user.userId === $scope.userStatus.username);
  };

  $scope.noWeight = function(){
    return ($scope.user.data.length>0) && ! _.last($scope.user.data).body.weight;
  };
});

angular.module('clientApp')
  .controller('ScoreController', function ($scope, UserState) {
    $scope.user = UserState.getMyState();

  });
