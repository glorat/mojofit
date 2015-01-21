'use strict';

angular.module('clientApp')
    .factory('WorkoutState', function (UserState) {
        var workout = {date:new Date().setHours(0,0,0,0).valueOf(), actions:[]};

        var ret = {
          getWorkout : function() {
            return workout;
          },
          setWorkout : function(newW) {
              workout.date = newW.date.valueOf();
              workout.actions = angular.copy(newW.actions);
          },
            setDate: function(newDate) {
              // Ensure we have a date object
              var d = new Date(newDate.valueOf());
              // JS UI requires local date
              var localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
              workout.date = localDate.valueOf();
              // Our data format requires UTC
                var myState = UserState.getMyState();
                var utc = +Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
                var edit = _.find(myState.data, function(x) {return x.date === utc;});
                if (edit) {
                    var acts = angular.copy(edit.actions);
                    workout.actions = acts;
                    workout.notes = edit.notes;
                }
                else {
                    workout.actions = [];
                    workout.notes = '';
                }

            }
        };
        return ret;
    });
