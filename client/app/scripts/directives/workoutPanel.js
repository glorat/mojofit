'use strict';



angular.module('clientApp').directive('workoutPanel', function() {
  // var vm = this;

  return {
    restrict: 'E',
    scope: {userStatus:'=', userState: '=', workoutDate: '='},
    templateUrl: 'views/workout-panel.html',
    // controllerAs : 'vm', // Not working since angular 1.3.x, see below for workarond
    controller: function ($scope, $location, WorkoutState, $filter, $rootScope) {
      var compressedData = {actions:[]};

      var enrichDataActions = function(data) {
        if (data && data.actions) {
          compressedData.actions = data.actions.map(compressAction);
        }
      };

      var compressAction = function(action) {
        var csets = [];
        var lastset = {name:'a nonce value', multiReps:[]};
        action.sets.forEach(function(aset) {
          if (aset.weight === lastset.weight) {
            lastset.multiReps.push(aset.reps);
          }
          else {
            var cset = angular.copy(aset);
            cset.multiReps = [aset.reps];
            csets.push(cset);
            lastset = cset;
          }
        });

        csets.forEach(function(aset) {
          if (aset.multiReps.length>1 && _.all(aset.multiReps, function(r){return r === aset.multiReps[0];})) {
            aset.reps = aset.multiReps.length + 'x' + aset.multiReps[0];
          }
          else {
            aset.reps = aset.multiReps.join('|');
          }
        });
        var newact = angular.copy(action);
        newact.compressedSets = csets;
        return newact;
      };

      $scope.i = _.find($scope.userState.data, function(item) {return item.date === $scope.workoutDate;});
      enrichDataActions($scope.i);
      // if (!i) ... ??? 404?

      // Because $scope.i is being evaulated statically, it goes stale when UserState changes
      // This event handler will trigger the update
      // TODO: Perhaps GetCurrentUser should return a promise of updates? Or maybe this indeed is best
      $rootScope.$on('UserState:stateLoaded', function(){
        $scope.i = _.find($scope.userState.data, function(item) {return item.date === $scope.workoutDate;});
        enrichDataActions($scope.i);

      });


      var scoreFor = function(date, exname) {
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


      var canEdit = function () {
        return ($scope.userState.userId === $scope.userStatus.id) || ($scope.userState.userId === $scope.userStatus.username);
      };

      var editWorkout = function(date) {
        WorkoutState.setUtcDate(date);
        $location.path('/track');
      };

      var editWeight = function(date) {
        if (canEdit()) {
          WorkoutState.setWeightDate(date);
          $location.path('/trackweight');
        }
      };

      var ctrl = {
        canEdit : canEdit,
        scoreFor: scoreFor,
        editWeight: editWeight,
        editWorkout: editWorkout,
        compressedData: compressedData
      };
      $scope.vm = ctrl; // Workaround for controllerAs not working
      return ctrl;
    }
  };
});
