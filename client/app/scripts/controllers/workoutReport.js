'use strict';

angular.module('clientApp')
  .controller('WorkoutReportController', function ($scope, MojoServer, UserState, $routeParams) {
    var vm = this;

    function parseDate (str) {
      // validate year as 4 digits, month as 01-12, and day as 01-31
      if ((str = str.match (/^(\d{4})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/))) {
        // make a date
        return Date.UTC (+str[1], +str[2] - 1, +str[3]);
      }
      return undefined;
    }

    vm.userId = $routeParams.userId;
    vm.workoutDate = parseDate($routeParams.workoutDate); // FIXME: Validate

    UserState.setCurrentUserId(vm.userId);
    vm.userState = UserState.getCurrentUser();
    vm.userLoadState = UserState.userLoadState;
    vm.userStatus = MojoServer.getUserStatus();

    return vm;
  });
