var repmaxFile = function() {

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
                        var kg = aset.weight; // FIXME: to kg
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

};
repmaxFile();