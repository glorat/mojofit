'use strict';

// Use these two for global callbacks to make the graph work
var jsonData;
function drawChart() {
    var data = new window.google.visualization.DataTable(jsonData);
    var options = {'hAxis':{'title':''},'vAxis':{'title':'','format':'# kg'},'width':900,'height':500,'interpolateNulls':'true','legend':{'position':'top','maxLines':5}};
    var chart = new window.google.visualization.LineChart(document.getElementById('chart_div'));
    chart.draw(data, options);
}

/**
 * @ngdoc function
 * @name clientApp.controller:UserCtrl
 * @description
 * # UserCtrl
 * Controller of the clientApp
 */
angular.module('clientApp')
  .controller('UserCtrl', function ($scope, $http, $routeParams) {
        $scope.userId = $routeParams.userId;

        console.log('UserCtrl userId ' + $scope.userId);

        var userstream = this;
        userstream.data = [];
        $http.get('/userraw/'+$scope.userId).success(function(data) {
            // Too many strings in the data
            data.map(function(item){
                item.date = parseInt(item.date);
                item.actions.map(function(action){
                   action.sets.map(function(set){
                       set.reps = parseInt(set.reps);
                       set.weight = parseInt(set.weight);
                   });
                });
                return item;
            });

            userstream.data = data;
        });

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

           $scope.addAction = function(index) {
               var newName = 'TODO';
                $scope.workout.actions.splice(index+1,0, {name:newName, sets:[]});
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