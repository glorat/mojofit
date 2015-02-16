'use strict';

angular.module('mojofit')
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
    var convert = function(from, fromUnit, toUnit) {
      if (fromUnit === toUnit) {
        return from;
      }
      else if (data[fromUnit] && data[toUnit] && data[fromUnit][1]===data[toUnit][1]) {
        return from * data[fromUnit][0] / data[toUnit][0];
      }
      else {
        return 0;
      }
    };

    var strengthScore = function(exname, wgt, unit, bw, bunit, gender /*,dob*/) {
      if (!exname) {return 0;}

      if (!bw) {
        bw = 100;
        bunit = 'kg'; // Big penalty for no bw supplied
      }

      if (gender === 'f') {
        return strengthScoreFemale(exname, wgt, unit, bw, bunit);
      }
      else {
        return strengthScoreMale(exname, wgt, unit, bw, bunit);
      }
    };

    var strengthScoreMale = function(exname, wgt, unit, bw, bunit /*, gender, dob*/) {
      var interceptMap = {'Barbell Squat':129, 'Barbell Bench Press':94, 'Barbell Deadlift':150};
      // 0.06 Even for deadlift? Certainly for SQ/BP
      var slopeMap = {'Barbell Squat':0.06, 'Barbell Bench Press':0.06, 'Barbell Deadlift':0.06};
      var wilksFn = maleWilks;
      if (!exname) {return 0;}
      return strengthScoreGen(interceptMap, slopeMap, wilksFn, exname, wgt, bunit, bw, unit);

    };

    function strengthScoreGen(interceptMap, slopeMap, wilksFn, exname, wgt, bunit, bw, unit) {
      var intercept = interceptMap[exname];
      var slope = slopeMap[exname];
      var bodyKg = convert(bw, bunit, 'kg');
      var wilks = wilksFn(bodyKg);
      var kg = convert(wgt, unit, 'kg');
      var wilksPoint = kg * wilks;
      var eliteWilks = intercept + bodyKg * slope;

      return wilksPoint / eliteWilks;
    }

    var strengthScoreFemale = function(exname, wgt, unit, bw, bunit /*, dob*/) {
      var interceptMap = {'Barbell Squat':129, 'Barbell Bench Press':94, 'Barbell Deadlift':150};
      var slopeMap = {'Barbell Squat':0, 'Barbell Bench Press':0, 'Barbell Deadlift':0};
      var wilksFn = femaleWilks;
      return strengthScoreGen(interceptMap, slopeMap, wilksFn, exname, wgt, bunit, bw, unit);
    };

        var ret = {
            convert : convert,
            maleWilks : maleWilks,
            femaleWilks : femaleWilks,
            strengthScore : strengthScore
        };
        return ret;
    });
