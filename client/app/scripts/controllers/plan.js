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

    var submitPlanCB = function() {
      UserState.reloadMyState();
    };

    $scope.submitWorkout = function() {
      var item = $scope.workout;
      $scope.workoutStatus = MojoServer.submitWorkout([item], submitCB);
    };

    $scope.submitPlan = function() {
      var item = $scope.workout;
      $scope.workoutStatus = MojoServer.submitPlan(item, submitPlanCB);
    };

    $scope.reset = function() {
      WorkoutState.setUtcDate($scope.workout.date);
    };

    $scope.onDateChanged = function() {
      WorkoutState.setUtcDate($scope.workout.date);
    };

    $scope.deletePlan = function() {
      var w = $scope.workout;
      w.actions = [];
      w.notes = '';
      w.program = {id:'', workout:''};
    };

    $scope.programNames = ProgramRegistry.listPrograms();

    var applyProgram = function(newVal){
      // When *anything* changes program, keep display in sync
      $scope.workoutNames = ProgramRegistry.listWorkouts(newVal);
      var program = ProgramRegistry.getProgram(newVal);
      if (program) {
        $scope.programName = program.name;

        // Update display
        $scope.paramKeys = program.paramKeys();
        $scope.paramSchema = program.paramSchemaByField();

      }
    };
    $scope.$watch('workout.program.id', applyProgram);

    $scope.onProgramChange = function() {
      // When user changes program, auto-select workoutt
      var program = ProgramRegistry.getProgram($scope.workout.program.id);
      if (program) {
        $scope.workout.program.workout = program ? program.chooseWorkout($scope.user) : '';
      }
    };

    var lastWorkoutProgram = function() {
      // TODO: Consider checking if the program is actually known
      if ($scope.user.data[0]
        && $scope.user.data[0].program) {
        return $scope.user.data[0].program;
      }
      else {
        return undefined;
      }
    };


    $scope.onChooseProgram = function() {

      var program = ProgramRegistry.getProgram($scope.workout.program.id);
      if (program) {
        var defParam = program.defaultParam($scope.user, 'kg');
        var param = program.genParams($scope.user, defParam);

        // Grab last time's params for comparison
        var last = lastWorkoutProgram();
        if (last && last.id === $scope.workout.program.id) {
          $scope.prevParam = last.param;
        }
        else {
          $scope.prevParam = undefined;
        }

        // Update model
        $scope.workout.program.param = param;
      }


      $scope.programCollapsed=1;
      $scope.paramShow=1;
      // Don't change between different forms of falsiness or it goes buggy
      $scope.paramCollapsed = $scope.paramCollapsed ? 0 : $scope.paramCollapsed;
      if ((!$scope.workout.program.param) || $scope.workout.program.param.length===0) {
        // Skip step 2
        $scope.workoutShow=1;
        $scope.paramCollapsed=1;
      }
    };

    $scope.applyWorkout = function() {
      var wout = $scope.workout;
      if ($scope.workout.actions.length===0 || window.confirm('Apply ' + wout.program.id + ' exercises for workout ' + wout.program.workout + '?')) {
        var program = ProgramRegistry.getProgram(wout.program.id);

        // FIXME: Grab param (and unit) from prefs
        var param = wout.program.param || program.defaultParam($scope.user, 'kg');

        var woutNew = program.applyWorkout(wout.program.workout, $scope.user, wout.date, param);
        $scope.workout.actions = woutNew.actions;

        // Hide the params now and show next step
        $scope.paramCollapsed = 1;
        $scope.workoutShow = 1;
      }
    };


    $scope.startOver = function() {
      var today = new Date();
      today.setUTCHours(0,0,0,0);
      WorkoutState.setUtcDate(today); // OR date picker?

      if ($scope.workout.actions.length>0) {
        // Toggle all back on if we are in fact good
        $scope.paramShow=1;
        $scope.paramCollapsed=1;
        $scope.workoutShow=1;
      }
      else {
        // Initial wizard state
        $scope.programCollapsed = 0;
        $scope.paramShow=0;
        $scope.workoutShow = 0;
        // Make some initial smart decisions
        var last = lastWorkoutProgram();
        if (last) {
          $scope.workout.program.id = last.id;
          $scope.onProgramChange();
        }

      }
      applyProgram($scope.workout.program.id);
    };

    $scope.startOver();

  });
