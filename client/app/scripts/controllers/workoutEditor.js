'use strict';


angular.module('clientApp').directive('workoutEditor', function() {
    return {
        restrict: 'E',
        scope: {workout:'='},
        templateUrl: 'views/workout-editor.html',
        controller: function ($scope, UserState, MojoServer, ProgramRegistry, Stronglifts, $timeout, $interval, localStorageService, $log) {
            // This is just for usedExercises.. can do better?
            $scope.user = UserState.getMyState();


          // I seem to have not copy/pasted this much elsewhere for datepicker
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
              if (!newName) {newName = $scope.newActionName;}
                if (newName) {
                    var emptySet = {weight:undefined, unit:$scope.user.prefs.preferredUnit || 'kg'};
                    $scope.workout.actions.push({name:newName, sets:[emptySet]});
                  $scope.newActionName='';
                }
                else {
                    // TODO: Tooltip
                    $timeout(function(){window.alert('Type an exercise and press enter or click to select it. It will be added below');});
                }

            };

            $scope.addAction = function(index) {
                var emptySet = {weight:undefined, unit:$scope.user.prefs.preferredUnit || 'kg'};
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
          // Code to regularly save the workout state in case we navigate away and service memory is lost
          var wk = localStorageService.get('workoutEditor');
          if (wk) {
            // No other checks to do apart from existance?
            $scope.workout = wk;
          }
          $scope.$watch('workout', function(toSave) {
            $log.info('Want to stash ' + angular.toJson(toSave));
            localStorageService.set('workoutEditor', toSave);
          }, true);

        }
    };
});


angular.module('clientApp').directive('actionSetsEditor', function() {
    return {
        restrict: 'E',
        scope: {action:'='},
        templateUrl: 'views/action-editor.html',
        controller: function ($scope, UserState, UnitConverter, PlateCalculator, $modal) {
          var userPrefs = UserState.getMyState().prefs;
          $scope.dispUnit = userPrefs.preferredUnit; // This is a non-reactive var

          $scope.needsConvert = function(aset) {
            return aset.unit !== $scope.dispUnit;
          };
          $scope.dispValue = function(aset) {
            return UnitConverter.convert(aset.weight, aset.unit, $scope.dispUnit);
          };
          $scope.platesFor = function(aset) {
            return PlateCalculator.getSolutionFor(aset.weight, aset.unit);
          };
          $scope.showPlates = function(aset) {
            var m = $modal.open({
              template: '<div class="modal-body"><h2>Use these plates</h2><plate-solution solution="solution"></plate-solution><button class="btn btn-primary" ng-click="$close(solution)">Use {{ solution.total | number:1 }}{{solution.unit}}</button><button class="btn btn-danger" ng-click="$dismiss()">Cancel</button></div>',
              controller: function($scope, solution) {
                $scope.solution = solution;
              },
              //size: 'lg',
              resolve: {
                solution: function () {
                  return PlateCalculator.getSolutionFor(aset.weight, aset.unit);
                }
              }
            });

            m.result.then(function (solution) {
              aset.weight = +solution.total.toFixed(1);
              aset.unit = solution.unit;
            });

          };
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
