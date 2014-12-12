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
  .controller('UserCtrl', function ($scope, $http, $routeParams) {
        $scope.userId = $routeParams.userId;

        $scope.activeDate = new Date();
        $scope.workoutDates = [];
        $scope.showChart = false;
        $scope.itemsPerPage = 20;

        var userstream = this;
        userstream.data = [];

        $http.get('/userraw/'+$scope.userId).success(function(data) {
            userstream.data = processData(data);
            userstream.usedExercises = usedExercises(data);
            userstream.repMax = genRepMax(data, userstream.usedExercises);

            $scope.workoutDates = userstream.data.map(function(x){return new Date(x.date).setHours(0,0,0,0).valueOf();});
            $scope.activeDate = new Date($scope.workoutDates[0]);
            $scope.showChart = true;
        });

        /*jshint unused: vars */
        function usedExercises(data) {
            //var nameByUse = {};

            return ['Barbell Squat', 'Barbell Bench Press', 'Barbell Deadlift', 'Standing Barbell Shoulder Press (OHP)'];
        }

        function processData(data) {
            // And do some name mappings
            var aliases = {'Bench Press':'Barbell Bench Press'};
            // Too many strings in the data
            data.map(function(item){
                item.date = parseInt(item.date);
                item.actions.map(function(action){
                    if (aliases[action.name]) {
                        action.name = aliases[action.name];
                    }
                    action.sets.map(function(set){
                        set.reps = +set.reps;
                        set.weight = +set.weight;
                    });
                });
                return item;
            });

            data.sort(function(a,b) {
               if (b.date < a.date) { return -1; }
               if (b.date > a.date) { return 1; }
               return 0;
            });

            return data;
        }

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

        function genRepMax(items, names) {
            var MAX_REP = 5;
            var repMaxByName = {};
            names.forEach(function(name) {
                var repMax = new Array(MAX_REP);
                for (var k=0;k<MAX_REP;k++) {repMax[k] ={kg:0,date:0};}
                repMaxByName[name] = repMax;
            });

            items.forEach(function(item){
                item.actions.forEach(function(action) {
                    if (repMaxByName[action.name]) {
                        var repMax = repMaxByName[action.name];
                        action.sets.forEach(function(aset){
                            var reps = aset.reps-1;
                            var kg = aset.weight; // FIXME: to kg
                            if (reps >= MAX_REP) {reps = MAX_REP-1;}
                            for (var i=0; i<=reps; i++) {
                                if (repMax[i].kg < kg) {
                                    repMax[i].kg = kg;
                                    repMax[i].date = item.date;
                                    repMax[i].reps = reps;
                                }
                            }
                        });
                    }
                });

            });
            return names.map(function(name) {
                return {name:name, repMax : repMaxByName[name]};
            });

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