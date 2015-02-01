'use strict';

angular.module('clientApp').directive('strengthScore', function () {
  // var userPrefs = MojoServer.getUserStatus().userPrefs;
  var POWER_LIFTS = ['Barbell Squat','Barbell Bench Press','Barbell Deadlift'];

  var scoreToGame = function(e) {
    // require e.keys has exname, scores, avgScore
    e.level = Math.floor(e.avgScore*10);
    e.points = Math.floor((e.avgScore*10- e.level)*100);
    return e;
  };

  function calcScore(data, repMax, UnitConverter, $log) {
// data is in reverse date order, hence first.
    // Hope that contract never changes!
    var bw = _.first(data).body.weight;
    var bunit = _.first(data).body.unit;
    if (!bw) {
      bw = 100;
      bunit = 'kg'; // Big penalty for no bw supplied
    }

    var ret = POWER_LIFTS.map(function (exname) {

      var perExRep = function (reps) {
        var rec = repMax[exname][reps].latest;
        var score = UnitConverter.strengthScore(exname, rec.est1rm, rec.est1rmUnit, bw, bunit);
        $log.debug('Score for ' + exname + ' with ' + reps + ' reps is ' + score);
        return score;
      };

      var perEx = _.range(1, 5 + 1).map(perExRep);

      var avg = _.reduce(perEx, function (memo, num) {
          return memo + num;
        }, 0) / perEx.length;

      return {exname: exname, scores: perEx, avgScore: avg};
    });
    return ret;
  }

  return {
    restrict: 'E',
    scope: {user: '='},
    templateUrl: 'views/strength-score.html',
    controller: function ($scope, UnitConverter, $log) {

      $scope.$watch('user.data', function (newVal) {
        var newData = newVal;

        if (newData.length > 0) {
          var repMax = $scope.user.repMax;
          var data = calcScore(newData, repMax, UnitConverter, $log);
          data = data.map(scoreToGame);
          $scope.data = data;
        }
      }, false);



    }
  };
});
