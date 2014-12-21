'use strict';

/* global google */
var repmaxFile = function() {

    var set_kg = function(s) {
        if (!s.unit) {
            return 0;
        }
        else if (s.unit === 'kg') {
            return s.weight;
        }
        else if (s.unit == 'lb')
        {
            return s.weight / 2.2;
        }
    }

    var genRepMax = function (items, names) {
        if (names === undefined) {
            return [];
        }

        var MAX_REP = 20;
        var repMaxByName = {};
        names.forEach(function (name) {
            var repMax = new Array(MAX_REP);
            for (var k = 0; k < MAX_REP; k++) {
                repMax[k] = {kg: 0, date: 0};
            }
            repMaxByName[name] = repMax;
        });

        items.forEach(function (item) {
            item.actions.forEach(function (action) {
                if (repMaxByName[action.name]) {
                    var repMax = repMaxByName[action.name];
                    action.sets.forEach(function (aset) {
                        var reps = aset.reps - 1;
                        var kg = set_kg(aset);
                        if (reps >= MAX_REP) {
                            reps = MAX_REP - 1;
                        }
                        for (var i = 0; i <= reps; i++) {
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
        return names.map(function (name) {
            return {name: name, repMax: repMaxByName[name]};
        });

    };

    var genRepMaxHistory = function(items, name) {
        var MAX_REP = 8;
        var repMax = new Array(MAX_REP);
        for (var k = 0; k < MAX_REP+1; k++) {
            repMax[k] = 0;
        }

        var byDate = _.groupBy(items, function(item){return new Date(item.date).setUTCHours(0,0,0,0).valueOf(); });
        var allDates = _.keys(byDate).map(function(x){return +x;});
        var minDate = _.min(allDates);
        var maxDate = _.max(allDates);
        var curDateObj = new Date(minDate);
        var curDate = curDateObj.valueOf();
        var history = [];// allDates.map(function(d) {return {date:d, repMax: angular.copy(repMax)};});

        while (curDate<maxDate) {
            if (byDate[curDate]) {
                var actions = byDate[curDate][0].actions;
                actions.forEach(function(action) {
                    if (action.name === name) {
                        action.sets.forEach(function(aset) {
                            var reps = aset.reps;
                            var kg = set_kg(aset);
                            if (reps >= MAX_REP) {
                                reps = MAX_REP;
                            }
                            repMax[0] = new Date(curDate);
                            for (var i = 1; i <= reps; i++) {
                                if (repMax[i] < kg) {
                                    repMax[i] = kg;
                                }
                            }
                            history.push(angular.copy(repMax));
                        });
                    }
                });
            }
            curDateObj.setDate(curDateObj.getDate() + 1); // I hate mutable classes
            curDate = curDateObj.valueOf();
        }
        return history;
    };

    var genRepMaxHistoryTable = function(items, name) {
        if (!items.length) {
            return undefined;
        }
        var history = genRepMaxHistory(items,name);
        var data = new google.visualization.DataTable();
        data.addColumn('date', 'Date');
        for (var i=1; i<history[0].length; i++) {
            data.addColumn('number', i + ' RM');
        }

        data.addRows(history);
        return data;

    };

    angular.module('clientApp').directive('repMaxTable', function () {

        return {
            restrict: 'E',
            scope: {userState: '=', width: '@'},
            templateUrl: 'views/rep-max-table.html',
            controller: function ($scope, $attrs) {
                if ($scope.width === undefined) {
                    $scope.width = 5;
                }

                $scope.$watch($attrs.userState, function (newVal, oldVal) {
                    console.log('user changed for repmax from' + oldVal + ' to ' + newVal);
                    $scope.repMax = genRepMax(newVal.data, newVal.usedExercises);
                    // genRepMaxHistoryTable(newVal.data, 'Barbell Squat');
                }, true);
            }
        };
    });

    angular.module('clientApp')
        .controller('RepMaxController', function ($scope, UserState) {
            $scope.width = 10; // That's how much we an fit in a full view
            var curr = UserState.getCurrentUser();
            $scope.repMax = genRepMax(curr.data, curr.usedExercises);
            //UserState.getCurrentUser().repMax;
        });


    angular.module('clientApp')
        .controller('RepMaxHistoryController', function ($scope, UserState, googleChartApiPromise) {
            var curr = UserState.getCurrentUser();

            //UserState.getCurrentUser().repMax;
            googleChartApiPromise.then(function() {
                var data = genRepMaxHistoryTable(curr.data, 'Barbell Squat');
                var options = {'hAxis':{'title':''},'vAxis':{'title':'','format':'# kg'},'interpolateNulls':'true','legend':{'position':'top','maxLines':5}};
                var chart = new window.google.visualization.LineChart(document.getElementById('rep-max-history-dev'));
                chart.draw(data, options);
            });
        });
};
repmaxFile();