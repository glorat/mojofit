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
                var d = new Date(newDate.valueOf());
                workout.date = newDate.valueOf();
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

angular.module('clientApp')
    .factory('UnitConverter', function () {
        var data = {
            'kg' : [1,'kg'],
            'lb' : [1/2.2, 'kg']
        };


        var maleWilks = function(kg) {
            kg = kg < 40.0 ? 40 : kg;
            kg = kg > 205.9 ? 205.9 : kg;
            var a=-216.0475144;
            var b=16.2606339;
            var c=-0.002388645;
            var d=-0.00113732;
            var e=0.00000701863;
            var f=-0.00000001291;
            var denom = a + b*kg + c*kg*kg + d*kg*kg*kg + e*kg*kg*kg*kg + f*kg*kg*kg*kg*kg;
            return 500/denom;
        };

        var femaleWilks = function(kg) {
            kg = kg < 40.0 ? 40 : kg;
            kg = kg > 150.9 ? 150.9 : kg;

            var a=594.31747775582;
            var b=-27.23842536447;
            var c=0.82112226871;
            var d=-0.00930733913;
            var e=0.00004731582;
            var f=-0.00000009054;
            var denom = a + b*kg + c*kg*kg + d*kg*kg*kg + e*kg*kg*kg*kg + f*kg*kg*kg*kg*kg;
            return 500/denom;
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
            },
            maleWilks : maleWilks,
            femaleWilks : femaleWilks
        };
        return ret;
    });