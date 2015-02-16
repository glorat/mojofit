'use strict';

/* global google */
var repmaxFile = function() {
    var pickout = function(fs, sf) {
        return fs.map(function(x) {
            return {name:x, repMax:sf[x]};
        });
    };

    angular.module('clientApp').directive('repMaxTable', function () {
        // var userPrefs = MojoServer.getUserStatus().userPrefs;

        return {
            restrict: 'E',
            scope: {user: '=', exercises: '=', width: '@', limitTo:'@'},
            templateUrl: 'views/rep-max-table.html',
            controller: function ($scope) {
                if ($scope.width === undefined) {
                    $scope.width = 5;
                }
                //$scope.repMax = genRepMax($scope.data, $scope.exercises);

                $scope.$watchCollection('[user, exercises]', function (newVals) {
                    var exs = _.first(newVals[1], $scope.limitTo);
                    var repMaxByName = $scope.user.stats.repMax;
                    var repMax = pickout(exs, repMaxByName);
                    $scope.repMax = repMax;
                }, false);
            }
        };
    });

    angular.module('clientApp')
        .controller('RepMaxController', function ($scope, UserState) {
            $scope.width = 10; // That's how much we an fit in a full view
            var curr = UserState.getCurrentUser();
            $scope.repMax = pickout(curr.usedExercises, curr.stats.repMax); // RepMaxCalculator.genRepMax(curr.data, curr.usedExercises, 'kg');
            //UserState.getCurrentUser().repMax;
        });

  angular.module('clientApp').directive('strengthHistoryGraph', function(){
    return {
      restrict: 'E',
      scope: {user: '='},
      template:'<div id="rep-max-history-dev" style="width: 100%; height: 200px;"><!-- TODO --></div>',
      //templateUrl: 'views/rep-max-history.html',
      controller: 'RepMaxHistoryController'
    };
  });

    angular.module('clientApp')
        .controller('RepMaxHistoryController', function ($scope, UserState, googleChartApiPromise, RepMaxCalculator, UnitConverter) {
        $scope.user = $scope.user || UserState.getCurrentUser();
        var curr = $scope.user;

            var genRepMaxHistoryTable = function() {
                if (!curr.data.length) {
                    return undefined;
                }

              var items = curr.data;
              var byDate = _.groupBy(items, function(item){return new Date(item.date).setUTCHours(0,0,0,0).valueOf(); });
              var allDates = _.keys(byDate).map(function(x){return +x;});
              var minDate = _.min(allDates);
              var maxDate = _.max(allDates);
              var daily = RepMaxCalculator.genDailyDates(minDate, maxDate);
              var columnar = [daily];

              var data = new google.visualization.DataTable();
              data.addColumn('date', 'Date');

              var POWER_LIFTS = ['Barbell Squat','Barbell Bench Press','Barbell Deadlift'];
              POWER_LIFTS.forEach(function(exname){
                columnar.push(RepMaxCalculator.calcScoreHistory(curr, exname, daily, UnitConverter, 'm'));
                data.addColumn('number',exname);
              });
              //var one = RepMaxCalculator.calcScoreHistory(curr, exname, daily, UnitConverter, 'm');
              var history = _.zip.apply(_, columnar);
                //var history = RepMaxCalculator.genRepMaxHistory(items,name, unit);

              data.addRows(history);
              return data;

            };

        $scope.$watch('user.data', function(){
          //UserState.getCurrentUser().repMax;
          googleChartApiPromise.then(function() {
            var data = genRepMaxHistoryTable();
            var options = {'hAxis':{'title':''},'vAxis':{'title':'Strength','format':'#%'},'interpolateNulls':'true','legend':{'position':'top','maxLines':5}};
            var chart = new window.google.visualization.LineChart(document.getElementById('rep-max-history-dev'));
            chart.draw(data, options);
          });
        });



      });
};
repmaxFile();
