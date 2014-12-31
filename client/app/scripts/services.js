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
                workout.date = newDate.valueOf();
                var myState = UserState.getMyState();
                var edit = _.find(myState.data, function(x) {return x.date === workout.date;});
                var acts = edit ? angular.copy(edit.actions) : [];
                workout.actions = acts;
            }
        };
        return ret;
    });

angular.module('clientApp')
    .factory('UnitConverter', function () {
        var data = {
            'kg' : [1,'kg'],
            'lb' : [1/2.2, 'kg']
        };

        var ret = {
            convert : function(from, fromUnit, toUnit) {
                if (fromUnit === toUnit) {
                    return from;
                }
                else if (data[fromUnit] && data[toUnit] && data[fromUnit][1]===data[toUnit][1]) {
                    return from * data[fromUnit][0] / data[toUnit][0];
                }
                else {
                    return 0;
                }
            }
        };
        return ret;
    });