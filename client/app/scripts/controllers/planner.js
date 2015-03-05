'use strict';


angular.module('clientApp')
  .controller('PlannerController', function ($scope, ProgramRegistry) {
    $scope.programNames = ProgramRegistry.listPrograms();

    $scope.workout = {workout:''};
    $scope.numWorkouts = 12;

    $scope.applyProgram = function() {
      var program = ProgramRegistry.getProgram($scope.workout.program);
      var user = {data:[]};
      var days = [2,2,3];
      var dayIndex = 0;
      var num = $scope.numWorkouts;
      var startDate = new Date();
      var dt =new Date(new Date(startDate).setUTCHours(0,0,0,0)).valueOf(); // TODO: To UTC date

      _.range(num).forEach(function(i){
        var wchoice = program.chooseWorkout(user);
        var wout = program.applyWorkout(wchoice, user);
        var ud = new Date(dt);
        var localDate = new Date(ud.getUTCFullYear(), ud.getUTCMonth(), ud.getUTCDate()); // For display
        user.data.unshift({date:dt, localDate :localDate, actions:wout.actions, program:program.name, workout:wchoice, index:i});
        // Increment
        ud = new Date(ud);
        dt = ud.setUTCDate(ud.getUTCDate() + days[dayIndex]).valueOf(); // I hate mutable classes
        dayIndex = (dayIndex === days.length-1) ? 0 : dayIndex+1;

      });
      $scope.items = _.groupBy(user.data, function(d){
        return Math.floor(d.index/days.length);
      });

    };

  });
