'use strict';



angular.module('clientApp').directive('workoutPanel', function() {
  // var vm = this;

  return {
    restrict: 'E',
    scope: {userStatus:'=', userState: '=', workoutDate: '='},
    templateUrl: 'views/workout-panel.html',
    controllerAs : 'vm',
    controller: function ($scope, $location, WorkoutState, $filter, $rootScope) {
      $scope.i = _.find($scope.userState.data, function(item) {return item.date === $scope.workoutDate;});
      // if (!i) ... ??? 404?

      // Because $scope.i is being evaulated statically, it goes stale when UserState changes
      // This event handler will trigger the update
      // TODO: Perhaps GetCurrentUser should return a promise of updates? Or maybe this indeed is best
      $rootScope.$on('UserState:stateLoaded', function(){
        $scope.i = _.find($scope.userState.data, function(item) {return item.date === $scope.workoutDate;});
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

      return {
        canEdit : canEdit,
        scoreFor: scoreFor,
        editWeight: editWeight,
        editWorkout: editWorkout
      };
    }
  };
});
