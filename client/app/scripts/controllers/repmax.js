'use strict';

/* global google */
angular.module('clientApp')
    .factory('RepMaxCalculator', function () {

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

        var genRepMaxFull = function (items, names, unit) {
            if (names === undefined || items === undefined) {
                return [];
            }

            var MAX_REP = 20;
            var repMaxByName = {};
            names.forEach(function (name) {
                var repMax = new Array(MAX_REP);
                repMax[0] = {reps:'Est 1', latest: {weight:0, uw:0}, history: []};
                for (var k = 1; k <= MAX_REP; k++) {
                    repMax[k] = {reps:k, latest: {weight:0, uw:0}, history: []};
                }
                repMaxByName[name] = repMax;
            });

            items.forEach(function (item) {
                item.actions.forEach(function (action) {
                    if (repMaxByName[action.name]) {
                        var repMax = repMaxByName[action.name];
                        action.sets.forEach(function (aset) {
                            var reps = aset.reps;
                            var uw = setUnited(aset, unit);
                            if (reps >= MAX_REP) {
                                reps = MAX_REP;
                            }
                            for (var i = 1; i <= reps; i++) {
                                if (repMax[i].latest.uw < uw) {
                                    var est = est1rm(uw, i);
                                    var entry = {weight:aset.weight, date:item.date, reps:reps, est1rm:est, uw:uw};
                                    repMax[i].latest = entry;
                                    repMax[i].history.push(entry);
                                    if (est > repMax[0].latest.uw) {
                                        repMax[0].latest = {weight:aset.weight, date:item.date, reps:reps, uw:est};
                                        repMax[0].history.push(entry);
                                    }
                                }
                            }
                        });
                    }
                });

            });
            var ret = repMaxByName;
            return ret;
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

        return {
            genRepMaxFull : genRepMaxFull,
            genRepMaxHistory : genRepMaxHistory
        };
    });

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
                    var repMaxByName = $scope.user.repMax;
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
            $scope.repMax = pickout(curr.usedExercises, curr.repMax); // RepMaxCalculator.genRepMax(curr.data, curr.usedExercises, 'kg');
            //UserState.getCurrentUser().repMax;
        });


    angular.module('clientApp')
        .controller('RepMaxHistoryController', function ($scope, UserState, googleChartApiPromise, RepMaxCalculator) {
            var curr = UserState.getCurrentUser();

            var genRepMaxHistoryTable = function(items, name, unit) {
                if (!items.length) {
                    return undefined;
                }
                var history = RepMaxCalculator.genRepMaxHistory(items,name, unit);
                var data = new google.visualization.DataTable();
                data.addColumn('date', 'Date');
                for (var i=1; i<history[0].length; i++) {
                    data.addColumn('number', i + ' RM');
                }

                data.addRows(history);
                return data;

            };


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