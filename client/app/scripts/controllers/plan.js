'use strict';

angular.module('clientApp')
  .controller('PlanController', function ($scope, $location, WorkoutState, UserState, MojoServer, ProgramRegistry) {
    $scope.workout = WorkoutState.getWorkout();
    $scope.user = UserState.getMyState();
    $scope.userStatus = MojoServer.getUserStatus();

    var submitCB = function() {
      UserState.reloadMyState();
      var id = $scope.userStatus.username;
      if (id) {
        $location.path('/user/' + id);
      }

    };

    var deleteCB = submitCB;

    $scope.submitWorkout = function() {
      var item = $scope.editWorkout;
      $scope.workoutStatus = MojoServer.submitWorkout([item], submitCB);
    };

    $scope.submitPlan = function() {
      var item = $scope.editWorkout;
      $scope.workoutStatus = MojoServer.submitPlan(item, submitCB);
    };

    $scope.reset = function() {
      WorkoutState.setUtcDate($scope.editWorkout.date);
    };

    $scope.onDateChanged = function() {
      WorkoutState.setUtcDate($scope.editWorkout.date);
    };

    $scope.deleteWorkout = function() {
      $scope.workoutStatus = MojoServer.deleteWorkout($scope.editWorkout.date, deleteCB);
    };

    $scope.$watch('workout.program.id', function(){
      $scope.workoutNames = ProgramRegistry.listWorkouts($scope.workout.program);
      var program = ProgramRegistry.getProgram($scope.workout.program);
      if (program) {
        $scope.paramSchema = program.paramSchemaByField();
        var defParam = program.defaultParam($scope.user, 'kg');
        var param = program.genParams($scope.user, defParam);
        $scope.param = param;
        $scope.paramKeys = program.paramKeys();
        $scope.programName = program.name;
        $scope.workout.program = program.id;
        $scope.workout.workout =  program ? program.chooseWorkout($scope.user) : '';
      }
      else {
        // ???
      }

    });

  });
