'use strict';

angular.module('clientApp')
  .controller('MobileUserController', function ($scope, $http, MojoServer, $routeParams, UserState, WorkoutState, $location) {
    $scope.userId = $routeParams.userId;
    $scope.userState = UserState.getCurrentUser();
    UserState.setCurrentUserId($scope.userId);
    $scope.showChart = false;
    $scope.itemsPerPage = 1;
    $scope.currentPage = 1;
    $scope.newWorkout = {date:new Date()};
    $scope.workoutStatus = {level:'info', message:''};
    $scope.userStatus = MojoServer.getUserStatus();
    $scope.maxPagesSize = 4;

    $scope.showChart = function(){
      return $scope.userState.data.length > 0;
    };

    $scope.datestr = function(ts) {
      return new Date(ts).toDateString();
    };

    $scope.canEdit = function() {
      return ($scope.userState.userId === $scope.userStatus.id) || ($scope.userState.userId === $scope.userStatus.username);
    };

    $scope.addWorkout = function() {
      var d = new Date($scope.newWorkout.date);
      var utcDate = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
      $scope.editWorkout({date:  utcDate});
    };

    $scope.editWorkout = function(date) {
      WorkoutState.setDate(date);
      $location.path('/track');
    };

    $scope.editWeight = function(date) {
      if ($scope.canEdit()) {
        WorkoutState.setWeightDate(date);
        $location.path('/trackweight');
      }
    };

  });
