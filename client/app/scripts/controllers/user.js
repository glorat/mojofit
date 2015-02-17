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

angular.module('clientApp')
  .factory('SetupSharedUserController', function() {
    var setupSharedUserController = function($scope,$filter,WorkoutState,$location){
      $scope.scoreFor = function(date, exname) {
        // TODO: Pull this from strengthHistory.cols
        var INDICES = ['foo Date', 'Barbell Squat','Barbell Bench Press','Barbell Deadlift'];
        var user = $scope.userState;
        var exIndex = _.indexOf(INDICES, exname);
        if (exIndex<0) {return '';}
        var item = _.find(user.data, function(it){return it.date.valueOf() === date.valueOf();});
        var itemIndex = item.index;
        var before = user.data[itemIndex+1];
        var after = user.data[itemIndex];
        var beforeScore = (before && before.scores) ? before.scores[exIndex] : 0;
        var afterScore = (after && after.scores) ? after.scores[exIndex] : 0;
        var gain = afterScore-beforeScore;
        /*if (gain < 0.00000001 && afterScore===0) {
         return 'WTF';
         }*/

        if (gain < 0.0005)
        {
          return '';
          //$filter('number')(afterScore*1000,0);
        }
        else {
          return '+' + $filter('number')(gain*1000,0) + ' pts';
        }
      };
      $scope.showChart = function(){
        return $scope.userState.data.length > 0;
      };

      $scope.datestr = function(ts) {
        return new Date(ts).toDateString();
      };

      $scope.canEdit = function () {
        return ($scope.userState.userId === $scope.userStatus.id) || ($scope.userState.userId === $scope.userStatus.username);
      };

      $scope.addWorkout = function() {
        var d = new Date($scope.newWorkout.date);
        var utcDate = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
        $scope.editWorkout(utcDate);
      };

      $scope.editWorkout = function(date) {
        WorkoutState.
          setDate(date);
        $location.
          path('/track');
      };

      $scope.editWeight = function(date) {
        if ($scope.canEdit()) {
          WorkoutState.setWeightDate(date);
          $location.path('/trackweight');
        }
      };
    };

    return {
      setup : setupSharedUserController
    };
  });
/**
 * @ngdoc function
 * @name clientApp.controller:UserCtrl
 * @description
 * # UserCtrl
 * Controller of the clientApp
 */
angular.module('clientApp')
  .controller('UserCtrl', function ($scope, $http, MojoServer, $routeParams, UserState, googleChartApiPromise, WorkoutState, $location, $filter, SetupSharedUserController) {
        $scope.userId = $routeParams.userId;
        $scope.userState = UserState.getCurrentUser();
        UserState.setCurrentUserId($scope.userId);
        $scope.showChart = false;
        $scope.itemsPerPage = 20;
        $scope.currentPage = 1;
        $scope.newWorkout = {date:new Date()};
        $scope.workoutStatus = {level:'info', message:''};
        $scope.userStatus = MojoServer.getUserStatus();

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
    SetupSharedUserController.setup($scope, $filter, WorkoutState, $location);
  });


angular.module('clientApp').directive('setText', function () {
    var tmpl = '{{ data.reps }} x {{ data.weight }} {{ data.unit }} <span ng-show="dispValue">({{ dispValue | number : 1}} {{dispUnit}})</span> <span class="label label-primary" ng-repeat="badge in badges">{{ badge }}</span>';

    return {
        restrict: 'E',
        scope: {data : '=', setBadges : '=', unit:'@'},
        controller: function ($scope, UnitConverter, UserState) {
          var userPrefs = UserState.getMyState().prefs;
          var dispUnit = userPrefs.preferredUnit; // This is a non-reactive var

          if (dispUnit && dispUnit !== $scope.data.unit) {
                var dispValue = UnitConverter.convert($scope.data.weight, $scope.data.unit, dispUnit);
                if (dispValue) {
                    $scope.dispValue = dispValue;
                    $scope.dispUnit = dispUnit;
                }
            }
            $scope.badges = $scope.setBadges.get($scope.data);
        },
        template: tmpl
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

