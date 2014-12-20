'use strict';


angular.module('clientApp')
    .controller('TrackController', function ($scope, $location, WorkoutState, UserState, MojoServer) {
        // $scope.userStatus = MojoServer.getUserStatus();
        $scope.editWorkout = WorkoutState.getWorkout();
        $scope.user = UserState.getCurrentUser(); //+ get from server?
        $scope.userStatus = MojoServer.getUserStatus();

        var submitCB = function() {
            UserState.reloadCurrentUser();
            var id = $scope.userStatus.username;
            if (id) {
                $location.path('/user/' + id);
            }

        };

        $scope.submitWorkout = function() {
            var item = $scope.editWorkout;
            // Ensure Date is UTC, even though we view in local. I hate JS
            var d =  new Date(item.date);
            item.date = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
            $scope.workoutStatus = MojoServer.submitWorkout([item], submitCB);

        };

    });