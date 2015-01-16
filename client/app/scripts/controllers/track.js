'use strict';


angular.module('clientApp')
    .controller('TrackController', function ($scope, $location, WorkoutState, UserState, MojoServer) {
        $scope.editWorkout = WorkoutState.getWorkout();
        $scope.user = UserState.getMyState();
        $scope.userStatus = MojoServer.getUserStatus();

        var submitCB = function() {
            UserState.reloadMyState();
            var id = $scope.userStatus.username;
            if (id) {
                $location.path('/user/' + id);
            }

        };

        var deleteCB = submitCB;


        $scope.submitWorkout = function() {
            var item = $scope.editWorkout;
            // Ensure Date is UTC, even though we view in local. I hate JS
            var d =  new Date(item.date);
            item.date = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
            $scope.workoutStatus = MojoServer.submitWorkout([item], submitCB);

        };

        $scope.deleteWorkout = function() {
            var item = $scope.editWorkout;
            var d =  new Date(item.date);
            var d2 = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
            $scope.workoutStatus = MojoServer.deleteWorkout(d2, deleteCB);
        };

    });


angular.module('clientApp')
    .controller('TrackWeightController', function ($scope, $location, WorkoutState, UserState, MojoServer) {
        var userStatus = MojoServer.getUserStatus();

        $scope.date = new Date().setHours(0,0,0,0,0,0);
        $scope.bw = {weight:0, unit:'kg'};

        var submitCB = function() {
            UserState.reloadMyState();
            var id = userStatus.username;
            if (id) {
                $location.path('/user/' + id);
            }

        };

        $scope.submitWeight = function() {
            var d = new Date($scope.date);
            d = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
            $scope.workoutStatus = MojoServer.submitWeight(d, $scope.bw, submitCB);
        }
    });