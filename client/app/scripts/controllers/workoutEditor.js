'use strict';


angular.module('clientApp').directive('workoutEditor', function() {
    return {
        restrict: 'E',
        scope: {workout:'='},
        templateUrl: 'views/workout-editor.html',
        controller: function ($scope, UserState, MojoServer) {
            var userPrefs = MojoServer.getUserPrefs();
            // This is just for usedExercises.. can do better?
            $scope.user = UserState.getMyState();

            $scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1
            };

            $scope.open = function($event) {
                $event.preventDefault();
                $event.stopPropagation();

                $scope.opened = true;
            };

            $scope.addNamedAction = function(newName) {
              var newName = $scope.newActionName;
                if (newName) {
                    var emptySet = {weight:undefined, unit:userPrefs.unit};
                    $scope.workout.actions.push({name:newName, sets:[emptySet]});
                  $scope.newActionName='';
                }
                else {
                    // TODO: Tooltip
                    window.alert('Type an exercise and press enter or click to select it. It will be added below');
                }

            };

            $scope.addAction = function(index) {
                var emptySet = {weight:undefined, unit:userPrefs.unit};
                var newName = '';
                $scope.workout.actions.splice(index+1,0, {name:newName, sets:[emptySet]});
            };

            $scope.removeAction = function(index) {
                var actToGo = $scope.workout.actions[index];
                if ($scope.workout.actions.length > 1) {
                    var setsRemoving = actToGo.sets.length;

                    if (setsRemoving < 2 || window.confirm('Really remove these '+setsRemoving + ' ' + actToGo.name +  ' entries ??')) {
                        $scope.workout.actions.splice(index,1);
                    }
                }
            };

            var reallyCloneLastTime = function(act) {
                var lastAct = _.chain($scope.user.data)
                    .map(function(x){return x.actions;})
                    .flatten()
                    .find(function(x){return x.name === act.name;})
                    .value();
                if (lastAct) {
                    act.sets = angular.copy(lastAct.sets);
                }
              else {
                  window.alert('I do not think you have done these before');
                }
            };

            $scope.cloneLastTime = function(index) {
                var act = $scope.workout.actions[index];
                var setsReplacing = act.sets.length;
                if (setsReplacing < 2 || window.confirm('Really replace these existing '+setsReplacing + ' ' + act.name +  ' entries?')) {
                    reallyCloneLastTime(act);
                }
            };

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
            $scope.onLastInputEnter = function(e, index) {
                if (index === $scope.action.sets.length - 1) {
                    var code = e.keyCode || e.which;
                    if (code === 13) {
                        e.preventDefault();
                        $scope.addSet(index);
                        // elem.nextAll('input').focus();
                    }
                }
            };
        }
    };
});
