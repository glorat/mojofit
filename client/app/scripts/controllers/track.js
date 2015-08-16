'use strict';


angular.module('clientApp')
    .controller('TrackController', function ($scope, $location, WorkoutState, UserState, MojoServer, stringDateFilter) {
        $scope.editWorkout = WorkoutState.getWorkout();
        $scope.user = UserState.getMyState();
        $scope.userStatus = MojoServer.getUserStatus();

        var submitCB = function() {
            UserState.reloadMyState();
            var id = $scope.userStatus.username;
            if (id) {
              // TODO: Use string formatter. Must be one in JS
              var url = '/user/' + id + "/" + stringDateFilter($scope.editWorkout.date);

                $location.path(url);
            }

        };

        var deleteCB = submitCB;

    $scope.submitWorkout = function() {
      var item = $scope.editWorkout;
      $scope.workoutStatus = MojoServer.submitWorkout([item], submitCB);
        };

    $scope.submitPlan = function() {
      var item = $scope.editWorkout;
      $scope.workoutStatus = MojoServer.submitPlan(item, submitCB);
    };

    $scope.reset = function() {
      WorkoutState.setUtcDate($scope.editWorkout.date);
    };

    $scope.onDateChanged = function() {
      WorkoutState.setUtcDate($scope.editWorkout.date);
    };

    $scope.deleteWorkout = function() {
        $scope.workoutStatus = MojoServer.deleteWorkout($scope.editWorkout.date, deleteCB);
    };

    });


angular.module('clientApp')
    .controller('TrackWeightController', function ($scope, $location, WorkoutState, UserState, MojoServer) {
        var userStatus = MojoServer.getUserStatus();

    $scope.weightInput = WorkoutState.getWeightInput();

        var submitCB = function() {
            UserState.reloadMyState();
            var id = userStatus.username;
            if (id) {
                $location.path('/user/' + id);
            }

        };

        $scope.submitWeight = function() {
            var d =$scope.weightInput.date;
            $scope.workoutStatus = MojoServer.submitWeight(d, $scope.weightInput.bw, submitCB);
        };
    });
