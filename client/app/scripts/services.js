'use strict';

angular.module('clientApp')
    .factory('WorkoutState', function (UserState, $log) {
    var user = UserState.getMyState();

    var today = new Date();
    today.setUTCHours(0,0,0,0);
    var utcToday = today.valueOf();

    var workout = {date:utcToday, actions:[]};
    var weight = {date:utcToday, bw: {weight:0, unit: 'kg'}};

    var saneDate = function(d) {
      d = new Date(d.valueOf());
      // JS UI requires local date
      var localDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      return localDate.valueOf();
    };

    function loadForUtcDate(utc) {
      var myState = UserState.getMyState();

      var edit = _.find(myState.data, function (x) {
        return x.date === utc;
      });
      if (edit) {
        var acts = angular.copy(edit.actions);
        workout.actions = acts;
        workout.notes = edit.notes;
        // FIXME: Knowledge of the fields in a workout is fragile
        workout.program = edit.program;
        workout.workout = edit.workout;
      }
      else if (myState.plan) {
        var plan = myState.plan;
        workout.actions = plan.actions;
        workout.notes = '';
        workout.program = plan.program;
        workout.workout = plan.workout;
      }
      else {
        workout.actions = [];
        workout.notes = '';
        workout.program = '';
        workout.workout = '';
      }
      workout.date = utc;
    }

    var ret = {
      getWorkout : function() {
            return workout;
          },
          getWeightInput : function() {
            return weight;
          },
          setWeightDate: function(newDate) {
            weight.date = newDate;
            weight.bw.unit = user.prefs.preferredUnit || 'kg';

          },
          setLocalDate: function(dt) {
            // Ensure we have a date object

            // Our data format requires UTC
            var utc = +Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate());
            loadForUtcDate(utc);
          },
          setUtcDate:function(utc) {
            loadForUtcDate(utc);
          }

        };
        return ret;
    });

angular.module('clientApp').directive('utcDate', function() {

  var assert = function(expr, msg) {
    if (!expr) {
      if (consle) {
        console.log('BUG: utcDate - ' + msg);
      }
      // debugger;
    }
  };

  var isUtcDate = function (dt) {
    if ('number' === typeof dt) {
      var dt2 = new Date(dt);
      dt2.setUTCHours(0,0,0,0);
      return (dt === dt2.valueOf());
    }
  };

  return { restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {

      if(ngModel) { // Don't do anything unless we have a model

        ngModel.$parsers.push(function (value) {
          if (value === undefined) {return undefined;}
          // Parse local date to utc
          assert(value instanceof Date, value + ' needs to be a date');
          var d = value;
          return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
        });

        ngModel.$formatters.push(function (value) {
          if (value === undefined) {return undefined;}
          // Format UTCDate into local date
          assert(isUtcDate(value),value + ' needs to be a number' );

          var d1 = new Date(value);
          var d2 = new Date(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate());
          assert(d1.getDate()===d2.getDate(), 'Date got shifted');
          return d2;

        });

      }
    }
  };
});
