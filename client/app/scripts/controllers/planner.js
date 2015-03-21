'use strict';

angular.module('clientApp')
  .controller('PlannerIndexController', function ($scope, $routeParams, ProgramRegistry) {
    $scope.programNames = ProgramRegistry.listPrograms();
  });

angular.module('clientApp')
  .controller('PlannerController', function ($scope, $routeParams, ProgramRegistry, UserState) {
    $scope.user = UserState.getMyState();
    $scope.programNames = ProgramRegistry.listPrograms();

    $scope.workout = {workout:''};
    $scope.numWorkouts = 12;

    var initProgram = function(programName){
      var user = $scope.user;
      var program = ProgramRegistry.getProgram(programName);
      if (program) {
        $scope.paramSchema = program.paramSchemaByField();
        var defParam = program.defaultParam(user, 'kg');
        var param = program.genParams(user, defParam);
        $scope.paramKeys = program.paramKeys();
        $scope.programName = program.name;
        // FIXME: !!!
        $scope.workout.program = {id:program.id, param:param, workout:''};
      }
      else {
        // 404???
      }


    };

    var programName = $routeParams.program;

    $scope.$watch('user.data', function(newData){
      initProgram(programName);
    });

    $scope.applyProgram = function() {
      var program = ProgramRegistry.getProgram($scope.workout.program.id);
      var origUser = $scope.user;
      var user = {data:[]};
      var param = $scope.workout.program.param;

      var days = [2,2,3];
      var dayIndex = 0;
      var num = $scope.numWorkouts;
      var startDate = new Date();
      var dt =new Date(new Date(startDate).setUTCHours(0,0,0,0)).valueOf(); // TODO: To UTC date

      _.range(num).forEach(function(i){
        var wchoice = program.chooseWorkout(user);
        var wout = program.applyWorkout(wchoice, user, dt, param);
        var ud = new Date(dt);
        var localDate = new Date(ud.getUTCFullYear(), ud.getUTCMonth(), ud.getUTCDate()); // For display
        user.data.unshift({date:dt, localDate :localDate, actions:wout.actions, program:program.name, workout:wchoice, index:i});
        // Increment
        ud = new Date(ud);
        dt = ud.setUTCDate(ud.getUTCDate() + days[dayIndex]).valueOf(); // I hate mutable classes
        dayIndex = (dayIndex === days.length-1) ? 0 : dayIndex+1;

      });

      var rows = [[]];
      var col = rows[0];
      var colIndex = 0;
      // Use of unshift here reverses the order
      user.data.forEach(function(item){
        col.unshift(item);
        colIndex++;
        if (colIndex === days.length) {
          colIndex=0;
          col = [];
          rows.unshift(col);
        }
      });

      $scope.items = rows;

    };

  });

angular.module('clientApp').directive('paramEditor', function(){
  return {
    restrict: 'E',
    scope: {param: '=', schema:'='},
    templateUrl: 'views/param-editor.html',
    controller: function() {

    }
  };
});
