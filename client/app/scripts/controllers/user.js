'use strict';

// Use these two for global callbacks to make the graph work

var jsonData;
function drawChart() {
    // There's a race condition here since google is being async loaded
    // Ideally one would install a callback
    if (allDoneJs && jsonData) {
        var data = new window.google.visualization.DataTable(jsonData);
        var options = {'hAxis':{'title':''},'vAxis':{'title':'','format':'# kg'},'interpolateNulls':'true','legend':{'position':'top','maxLines':5}};
        var chart = new window.google.visualization.LineChart(document.getElementById('chart_div'));
        chart.draw(data, options);
    }
    else {
        console.log('Not ready to drawChart');
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
  .controller('UserCtrl', function ($scope, $http, $routeParams, UserState) {
        $scope.userId = $routeParams.userId;
        $scope.userState = UserState.getCurrentUser();
        UserState.setCurrentUserId($scope.userId);
        $scope.showChart = false;
        $scope.itemsPerPage = 20;
        $scope.currentPage = 1;
        $scope.newWorkout = {date:new Date()};

        $scope.showChart = function(){
            return $scope.userState.data.length > 0;
        };

        $scope.datestr = function(ts) {
            return new Date(ts).toDateString();
        };

        $.ajax({
            url: '/userjson/' + $scope.userId,
            dataType:'script',
            async: true,
            /*jshint unused: vars */
            success: function(data, text, foo) {
                drawChart();
            }
        });

        $scope.addWorkout = function() {
            $scope.editWorkout = {date: $scope.newWorkout.date, actions:[]};
            $scope.showAddWorkout = false;
        }
    });


angular.module('clientApp').directive('setText', function () {
    return {
        restrict: 'E',
        scope: {data : '=', unit:'@'},
        controller: function ($scope) {
            $scope.storedUnit = function() {
                if ( $scope.data.lbs) {return 'lbs';}
                else {return 'kg';}
            };
            $scope.value = function() {
                var myUnit = $scope.storedUnit();
                return $scope.data[myUnit];
            };

        },
        template: '{{ data.reps }} x {{ data.weight }} {{ data.unit }}'
    };
});

angular.module('clientApp').directive('workoutEditor', function() {
   return {
       restrict: 'E',
       scope: {workout:'='},
       templateUrl: 'views/workout-editor.html',
       controller: function ($scope, UserState) {
           $scope.user = UserState.getCurrentUser(); //+ get from server?

           $scope.dateOptions = {
               formatYear: 'yy',
               startingDay: 1
           };

           $scope.open = function($event) {
               $event.preventDefault();
               $event.stopPropagation();

               $scope.opened = true;
           };

           $scope.addNamedAction = function(newName) {;
               $scope.workout.actions.push({name:newName, sets:[{}]});
           };

           $scope.addAction = function(index) {
               var newName = '';
                $scope.workout.actions.splice(index+1,0, {name:newName, sets:[{}]});
           };

           $scope.removeAction = function(index) {
               if ($scope.workout.actions.length > 1) {
                   $scope.workout.actions.splice(index,1);
               }
           };
           /*
                      $scope.data = {
                          date: function (d) {
                          if (angular.isDefined(d)) {
                              $scope.workout.date = (d.getTime() - d.getMilliseconds()) / 1000;
                          }
                          console.log("date upda");
                          return new Date($scope.workout.date * 1000);
                      }
                      };
           */
       }
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


angular.module('clientApp').directive('actionSetsEditor', function() {
    return {
        restrict: 'E',
        scope: {action:'='},
        templateUrl: 'views/action-editor.html',
        controller: function ($scope) {
            $scope.addSet = function(index) {
                var newSet = angular.copy($scope.action.sets[index]);
                $scope.action.sets.splice(index+1,0, newSet);
            };

            $scope.removeSet = function(index) {
                if ($scope.action.sets.length > 1) {
                    $scope.action.sets.splice(index,1);
                }
            };
        }
    };
});


angular.module('clientApp').directive('repMaxTable', function() {
    return {
        restrict: 'E',
        scope: {userState:'=', width:'@'},
        templateUrl: 'views/rep-max-table.html',
        controller: function ($scope) {
            if ($scope.width === undefined) {
                $scope.width = 5;
            }
        }
    };
});

angular.module('clientApp')
    .controller('RepMaxController', function ($scope, UserState) {
        $scope.width = 10; // That's how much we an fit in a full view
        $scope.userState = UserState.getCurrentUser();
    });