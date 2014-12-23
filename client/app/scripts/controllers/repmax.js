'use strict';

/* global google */
var repmaxFile = function() {

    var setKg = function(s) {
        if (!s.unit) {
            return 0;
        }
        else if (s.unit === 'kg') {
            return s.weight;
        }
        else if (s.unit === 'lb')
        {
            return s.weight / 2.2;
        }
    };

    var genRepMax = function (items, names) {
        if (names === undefined || items === undefined) {
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
                        var kg = setKg(aset);
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

    function repMaxFromSet(aset, MAX_REP, origRepMax, curDate) {
        var repMax = origRepMax;
        var reps = aset.reps;
        var kg = setKg(aset);
        if (reps >= MAX_REP) {
            reps = MAX_REP;
        }
        repMax[0] = new Date(curDate);
        for (var i = 1; i <= reps; i++) {
            if (repMax[i] < kg) {
                repMax[i] = kg;
            }
        }
        return repMax;
    }

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

        var accRepMax = function(aset, history) {
            repMax = repMaxFromSet(aset, MAX_REP, repMax, curDate);
            history.push(repMax);
        };

        var processAction = function(action) {
            if (action.name === name) {
                action.sets.forEach(accRepMax);
            }
        };

        while (curDate<maxDate) {
            if (byDate[curDate]) {
                var actions = byDate[curDate][0].actions;
                actions.forEach(processAction);
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
            scope: {data: '=', exercises: '=', width: '@'},
            templateUrl: 'views/rep-max-table.html',
            controller: function ($scope) {
                if ($scope.width === undefined) {
                    $scope.width = 5;
                }
                //$scope.repMax = genRepMax($scope.data, $scope.exercises);

                $scope.$watchCollection('[data, exercises]', function (newVals) {
                    $scope.repMax = genRepMax(newVals[0], newVals[1]);
                }, false);
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