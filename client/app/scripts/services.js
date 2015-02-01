'use strict';

angular.module('clientApp')
    .factory('WorkoutState', function (UserState, $log) {
        var workout = {date:new Date().setHours(0,0,0,0).valueOf(), actions:[]};
        var weight = {date:new Date().setHours(0,0,0,0).valueOf(), bw: {weight:0, unit:'kg'}};

    var saneDate = function(d) {
      d = new Date(d.valueOf());
      // JS UI requires local date
      var localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return localDate.valueOf();
    };

        var ret = {
          getWorkout : function() {
            return workout;
          },
          setWorkout : function(newW) {
            $log.error ('This function should be deprecated');
              workout.date = newW.date.valueOf();
              workout.actions = angular.copy(newW.actions);
          },
          getWeightInput : function() {
            return weight;
          },
          setWeightDate: function(newDate) {
            weight.date = saneDate(newDate);
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
