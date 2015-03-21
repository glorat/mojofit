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

    $scope.startOver = function() {

    };

    $scope.programNames = ProgramRegistry.listPrograms();

    var applyProgram = function(newVal){
      $scope.workoutNames = ProgramRegistry.listWorkouts(newVal);
      var program = ProgramRegistry.getProgram(newVal);
      if (program && !$scope.workout.program.workout) {
        // Auto select a program for the user
        $scope.workout.program.workout =  program ? program.chooseWorkout($scope.user) : '';
        $scope.programName = program.name;


        // Update display
        $scope.paramKeys = program.paramKeys();
        $scope.paramSchema = program.paramSchemaByField();
        var defParam = program.defaultParam($scope.user, 'kg');
        var param = program.genParams($scope.user, defParam);


        // Update model
        $scope.workout.program.id = program.id;
        $scope.workout.program.workout =  program ? program.chooseWorkout($scope.user) : '';
        $scope.workout.program.param = param;

      }
    };

    $scope.onChooseProgram = function() {
      $scope.programCollapsed=1;
      $scope.paramShow=1;
      if ((!$scope.workout.program.param) || $scope.workout.program.param.length===0) {
        // Skip step 2
        $scope.workoutShow=1;
        $scope.paramCollapsed=1;
      }
    };

    $scope.$watch('workout.program.id', applyProgram);

    $scope.applyWorkout = function() {
      if ($scope.workout.actions.length==0 || window.confirm('Apply ' + $scope.workout.program.id + ' exercises for workout ' + $scope.workout.program.workout + '?')) {
        var program = ProgramRegistry.getProgram($scope.workout.program.id);

        // FIXME: Grab param (and unit) from prefs
        var param = $scope.workout.program.param || program.defaultParam($scope.user, 'kg');

        var wout = program.applyWorkout($scope.workout.workout, $scope.user, $scope.workout.date, param);
        $scope.workout.actions = wout.actions;

        // Hide the params now and show next step
        $scope.paramCollapsed = 1;
        $scope.workoutShow = 1;
      }
    };

  });
