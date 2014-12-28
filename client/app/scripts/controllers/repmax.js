'use strict';

/* global google */
var repmaxFile = function() {

    var setUnited = function(s, unit) {
        if (!s.unit) {
            return 0;
        }
        else if (s.unit === unit) {
            return s.weight;
        }
        else if (s.unit === 'kg' && unit === 'lb') {
            return s.weight * 2.2;
        }
        else if (s.unit === 'lb' && unit === 'kg') {
            return s.weight / 2.2;
        }
        else {
            // Oops - warn?
            return 0;
        }
    };

    var est1rm = function(weight, reps) {
        var capreps = (reps>5) ? 5 : reps;
        return weight / (1.0278-0.0278*capreps);
    };

    var genRepMax = function (items, names, unit) {

        if (names === undefined || items === undefined) {
            return [];
        }

        var MAX_REP = 20;
        var repMaxByName = {};
        names.forEach(function (name) {
            var repMax = new Array(MAX_REP);
            for (var k = 0; k < MAX_REP; k++) {
                repMax[k] = {weight: 0, date: 0};
            }
            repMaxByName[name] = repMax;
        });

        items.forEach(function (item) {
            item.actions.forEach(function (action) {
                if (repMaxByName[action.name]) {
                    var repMax = repMaxByName[action.name];
                    action.sets.forEach(function (aset) {
                        var reps = aset.reps;
                        var weight = setUnited(aset, unit);
                        if (reps >= MAX_REP) {
                            reps = MAX_REP;
                        }
                        for (var i = 0; i <= reps-1; i++) {
                            if (repMax[i].weight < weight) {
                                repMax[i].weight = weight;
                                repMax[i].date = item.date;
                                repMax[i].reps = i+1;
                                repMax[i].est1rm = est1rm(weight, i+1);
                            }
                        }
                    });
                }
            });

        });
        return names.map(function (name) {
            var repMax = repMaxByName[name];
            if (repMax[1].weight>0) {
                var estRepMax = _.chain(repMax)
                    .filter(function(x) {return x.reps<=5;})
                    .map(function(x) {return x.est1rm;})
                    .max()
                    .value();
                repMax.unshift({weight:estRepMax, reps:'Est 1'});
            }
            return {name: name, repMax: repMax};
        });

    };

    function repMaxFromSet(aset, MAX_REP, origRepMax, curDate, unit) {
        var repMax = origRepMax;
        var reps = aset.reps;
        var kg = setUnited(aset, unit);
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

    var genRepMaxHistory = function(items, name, unit) {
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

        var accRepMax = function(aset) {
            repMax = repMaxFromSet(aset, MAX_REP, repMax, curDate, unit);
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

    var genRepMaxHistoryTable = function(items, name, unit) {
        if (!items.length) {
            return undefined;
        }
        var history = genRepMaxHistory(items,name, unit);
        var data = new google.visualization.DataTable();
        data.addColumn('date', 'Date');
        for (var i=1; i<history[0].length; i++) {
            data.addColumn('number', i + ' RM');
        }

        data.addRows(history);
        return data;

    };

    angular.module('clientApp').directive('repMaxTable', function (MojoServer) {
        var userPrefs = MojoServer.getUserStatus().userPrefs;

        return {
            restrict: 'E',
            scope: {data: '=', exercises: '=', width: '@', limitTo:'@'},
            templateUrl: 'views/rep-max-table.html',
            controller: function ($scope) {
                if ($scope.width === undefined) {
                    $scope.width = 5;
                }
                //$scope.repMax = genRepMax($scope.data, $scope.exercises);

                $scope.$watchCollection('[data, exercises]', function (newVals) {
                    var exs = _.first(newVals[1], $scope.limitTo);
                    $scope.repMax = genRepMax(newVals[0], exs, userPrefs.unit);
                }, false);
            }
        };
    });

    angular.module('clientApp')
        .controller('RepMaxController', function ($scope, UserState) {
            $scope.width = 10; // That's how much we an fit in a full view
            var curr = UserState.getCurrentUser();
            $scope.repMax = genRepMax(curr.data, curr.usedExercises, 'kg');
            //UserState.getCurrentUser().repMax;
        });


    angular.module('clientApp')
        .controller('RepMaxHistoryController', function ($scope, UserState, googleChartApiPromise) {
            var curr = UserState.getCurrentUser();

            //UserState.getCurrentUser().repMax;
            googleChartApiPromise.then(function() {
                var data = genRepMaxHistoryTable(curr.data, 'Barbell Squat', 'kg');
                var options = {'hAxis':{'title':''},'vAxis':{'title':'','format':'# kg'},'interpolateNulls':'true','legend':{'position':'top','maxLines':5}};
                var chart = new window.google.visualization.LineChart(document.getElementById('rep-max-history-dev'));
                chart.draw(data, options);
            });
        });
};
repmaxFile();