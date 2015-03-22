'use strict';

angular.module('clientApp')
  .controller('MobileUserController', function ($scope, $http, MojoServer, $routeParams, UserState, WorkoutState, $location, $filter, SetupSharedUserController) {
    $scope.userId = $routeParams.userId;
    UserState.setCurrentUserId($scope.userId);
    $scope.showChart = false;
    $scope.itemsPerPage = 1;
    $scope.currentPage = 1;
    var today = new Date();
    $scope.newWorkout = {date:Date.UTC(today.getFullYear(), today.getMonth(),today.getDate())};
    $scope.workoutStatus = {level:'info', message:''};
    $scope.userStatus = MojoServer.getUserStatus();
    $scope.maxPagesSize = 4;

    SetupSharedUserController.setup($scope, $filter, WorkoutState, UserState, $location);

  });
