'use strict';

angular.module('clientApp')
    .factory('WorkoutState', function (UserState, $log) {
    var user = UserState.getMyState();

    var workout = {date:new Date().setHours(0,0,0,0).valueOf(), actions:[]};
    var weight = {date:new Date().setHours(0,0,0,0).valueOf(), bw: {weight:0, unit: 'kg'}};

    var saneDate = function(d) {
      d = new Date(d.valueOf());
      // JS UI requires local date
      var localDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
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
            weight.bw.unit = user.prefs.preferredUnit || 'kg';

          },
            setDate: function(newDate) {
              // Ensure we have a date object
              var d = new Date(newDate.valueOf());
              // JS UI requires local date
              var localDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
              workout.date = localDate.valueOf();
              // Our data format requires UTC
                var myState = UserState.getMyState();
                var utc = +Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
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
