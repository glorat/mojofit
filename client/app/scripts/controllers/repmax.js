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


    angular.module('clientApp')
        .controller('RepMaxHistoryController', function ($scope, UserState, googleChartApiPromise, RepMaxCalculator, UnitConverter) {
            var curr = UserState.getCurrentUser();

            var genRepMaxHistoryTable = function(exname) {
                if (!curr.data.length) {
                    return undefined;
                }
              var history = RepMaxCalculator.calcScoreHistory(curr, exname, UnitConverter);
                //var history = RepMaxCalculator.genRepMaxHistory(items,name, unit);
                var data = new google.visualization.DataTable();
                data.addColumn('date', 'Date');
                data.addColumn({type:'number',label:'Strength', pattern:'#%'});

                data.addRows(history);
                return data;

            };


            //UserState.getCurrentUser().repMax;
            googleChartApiPromise.then(function() {
                var data = genRepMaxHistoryTable('Barbell Squat');
                var options = {'hAxis':{'title':''},'vAxis':{'title':'Strength','format':'#%'},'interpolateNulls':'true','legend':{'position':'top','maxLines':5}};
                var chart = new window.google.visualization.LineChart(document.getElementById('rep-max-history-dev'));
                chart.draw(data, options);
            });
        });
};
repmaxFile();
