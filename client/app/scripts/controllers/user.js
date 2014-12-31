'use strict';

// Use these two for global callbacks to make the graph work

var jsonData;
function drawChart() {
    // There's a race condition here since google is being async loaded
    // Ideally one would install a callback
    if (jsonData) {
        var data = new window.google.visualization.DataTable(jsonData);
        var options = {'hAxis':{'title':''},'vAxis':{'title':'','format':'# kg'},'interpolateNulls':'true','legend':{'position':'top','maxLines':5}};
        var target = document.getElementById('chart_div');
        if (target) {
            var chart = new window.google.visualization.LineChart(target);
            chart.draw(data, options);
        }
        // Else the container must have went away
    }
    else {
        // Can't have this in IE9
        // console.log('Not ready to drawChart');
    }
}

/**
 * @ngdoc function
 * @name clientApp.controller:UserCtrl
 * @description
 * # UserCtrl
 * Controller of the clientApp
 */
angular.module('clientApp')
  .controller('UserCtrl', function ($scope, $http, MojoServer, $routeParams, UserState, googleChartApiPromise, WorkoutState, $location) {
        $scope.userId = $routeParams.userId;
        $scope.userState = UserState.getCurrentUser();
        UserState.setCurrentUserId($scope.userId);
        $scope.showChart = false;
        $scope.itemsPerPage = 20;
        $scope.currentPage = 1;
        $scope.newWorkout = {date:new Date()};
        $scope.workoutStatus = {level:'info', message:''};
        $scope.userStatus = MojoServer.getUserStatus();

        $scope.showChart = function(){
            return $scope.userState.data.length > 0;
        };

        $scope.datestr = function(ts) {
            return new Date(ts).toDateString();
        };

        $scope.canEdit = function() {
            return ($scope.userState.userId === $scope.userStatus.id) || ($scope.userState.userId === $scope.userStatus.username);
        };

        // This ajax currently fills in jusonData
        $.ajax({
            url: '/userjson/' + $scope.userId,
            dataType:'script',
            async: true,
            /*jshint unused: vars */
            success: function(data, text, foo) {
                googleChartApiPromise.then(function () {
                    drawChart();
                });
            }
        });

        $scope.addWorkout = function() {
            var d = new Date($scope.newWorkout.date);
            var utcDate = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
            $scope.editWorkout({date:  utcDate});
        };

        $scope.editWorkout = function(newW) {
            // WorkoutState.setWorkout(newW);
            WorkoutState.setDate(newW.date);
            $location.path('/track');
        };


    });


angular.module('clientApp').directive('setText', function (MojoServer, UnitConverter) {
    var userPrefs = MojoServer.getUserStatus().userPrefs;
    var dispUnit = userPrefs.unit; // This is a non-reactive var

    return {
        restrict: 'E',
        scope: {data : '=', unit:'@'},
        controller: function ($scope) {
            if (dispUnit !== $scope.data.unit) {
                var dispValue = UnitConverter.convert($scope.data.weight, $scope.data.unit, dispUnit);
                if (dispValue) {
                    $scope.dispValue = dispValue;
                    $scope.dispUnit = dispUnit;
                }
            }
        },
        template: '{{ data.reps }} x {{ data.weight }} {{ data.unit }} <span ng-show="dispValue">({{ dispValue | number : 1}} {{dispUnit}})</span>'
    };
});


angular.module('clientApp').directive('newWorkout', function() {
    return {
        restrict: 'E',
        scope: {newWorkout:'='},
        templateUrl: 'views/new-workout.html',
        controller: function ($scope) {

            $scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1
            };

            $scope.open = function($event) {
                $event.preventDefault();
                $event.stopPropagation();

                $scope.opened = true;
            };

        }
    };
});

