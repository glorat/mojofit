'use strict';

(function( myService){

    if (typeof module !== 'undefined' && module.exports ) {
        module.exports = myService();
    } else if( angular) {
        angular.module('clientApp')
            .factory('RepMaxCalculator', function(){
                return myService();
            });
    } else {
        // Die?
        // window.myService = myService;
    }

}(function () {
  var POWER_LIFTS = ['Barbell Squat','Barbell Bench Press','Barbell Deadlift'];

  var setUnited = function(s, unit) {
            if (!s.unit) {
                return 0;
            }
            else if (s.unit === unit) {
                return s.weight;
            }
            else if (s.unit === 'kg' && unit === 'lb') {
                return s.weight * 2.2;
            }
            else if (s.unit === 'lb' && unit === 'kg') {
                return s.weight / 2.2;
            }
            else {
                // Oops - warn?
                return 0;
            }
        };

        var est1rm = function(weight, reps) {
            var capreps = (reps>5) ? 5 : reps;
            return weight / (1.0278-0.0278*capreps);
        };

  var defaultRepMax = function() {
    return {weight:0, uw:0, est1rm:0};
  };

        var genRepMaxFull = function (itemsOrig, names, unit) {
            if (names === undefined || itemsOrig === undefined) {
                return [];
            }
          // This could just as well be .reverse
          var items = _.sortBy(itemsOrig, function(x){return x.date;});

            var MAX_REP = 20;
            var repMaxByName = {};
            names.forEach(function (name) {
                var repMax = new Array(MAX_REP);
                repMax[0] = {reps:'Est 1', latest: defaultRepMax(), history: []};
                for (var k = 1; k <= MAX_REP; k++) {
                    repMax[k] = {reps:k, latest:defaultRepMax(), history: []};
                }
                repMaxByName[name] = repMax;
            });

            items.forEach(function (item) {
                item.actions.forEach(function (action) {
                    if (repMaxByName[action.name]) {
                        var repMax = repMaxByName[action.name];
                        action.sets.forEach(function (aset) {
                            var reps = aset.reps;
                            var uw = setUnited(aset, unit);
                            if (reps >= MAX_REP) {
                                reps = MAX_REP;
                            }
                            for (var i = 1; i <= reps; i++) {
                                if (repMax[i].latest.uw < uw) {
                                    var est = est1rm(uw, i);
                                    var entry = {weight:aset.weight, est1rmUnit:unit, date:item.date, reps:aset.reps, est1rm:est, uw:uw};
                                    repMax[i].latest = entry;
                                    repMax[i].history.push(entry);
                                    if (est > repMax[0].latest.uw) {
                                        repMax[0].latest = {weight:aset.weight, est1rmUnit:unit, date:item.date, reps:aset.reps, uw:est};
                                        repMax[0].history.push(entry);
                                    }
                                }
                            }
                        });
                    }
                });

            });
            var ret = repMaxByName;
            return ret;
        };

        function repMaxFromSet(aset, MAX_REP, origRepMax, curDate, unit) {
            var repMax = angular.copy(origRepMax);
            var reps = aset.reps;
            var kg = setUnited(aset, unit);
            if (reps >= MAX_REP) {
                reps = MAX_REP;
            }
            repMax[0] = new Date(curDate);
            for (var i = 1; i <= reps; i++) {
                if (repMax[i] < kg) {
                    repMax[i] = kg;
                }
            }
            return repMax;
        }

        var genRepMaxHistory = function(items, exname, unit) {
            var MAX_REP = 8;
            var repMax = new Array(MAX_REP);
            for (var k = 0; k < MAX_REP+1; k++) {
                repMax[k] = 0;
            }

            var byDate = _.groupBy(items, function(item){return new Date(item.date).setUTCHours(0,0,0,0).valueOf(); });
            var allDates = _.keys(byDate).map(function(x){return +x;});
            var minDate = _.min(allDates);
            var maxDate = _.max(allDates);
            var curDateObj = new Date(minDate);
            var curDate = curDateObj.valueOf();
            var history = [];// allDates.map(function(d) {return {date:d, repMax: angular.copy(repMax)};});

            var accRepMax = function(aset) {
              repMax = repMaxFromSet(aset, MAX_REP, repMax, curDate, unit);
              //var score = UnitConverter.strengthScore(exname, rec.est1rm, rec.est1rmUnit, bw, bunit, gender);

              history.push(repMax);
            };

            var processAction = function(action) {
                if (action.name === exname) {
                    action.sets.forEach(accRepMax);
                }
            };

            while (curDate<maxDate) {
                if (byDate[curDate]) {
                    var actions = byDate[curDate][0].actions;
                    actions.forEach(processAction);
                }
                curDateObj.setDate(curDateObj.getDate() + 1); // I hate mutable classes
                curDate = curDateObj.valueOf();
            }
            return history;
        };


  var scoreToGame = function(e) {
    // require e.keys has exname, scores, avgScore
    e.level = Math.floor(e.avgScore*10);
    e.points = Math.floor((e.avgScore*10- e.level)*100);
    return e;
  };

  function calcScoreForExercise(repMaxEx, UnitConverter, exname, bw, bunit, gender) {
    var perExRep = function (reps) {
      var rec = repMaxEx[reps].latest;

      var score = rec ? UnitConverter.strengthScore(exname, rec.est1rm, rec.est1rmUnit, bw, bunit, gender) : 0;
      return score;
    };

    var perEx = _.range(1, 5 + 1).map(perExRep);

    var avg = _.reduce(perEx, function (memo, num) {
        return memo + num;
      }, 0) / perEx.length;

    return {exname: exname, scores: perEx, avgScore: avg};
  }

  function calcScore2(repMax, UnitConverter, bw, bunit, gender) {
    var ret = POWER_LIFTS.map(function (exname) {
      var repMaxEx = repMax[exname];
      return calcScoreForExercise(repMaxEx, UnitConverter, exname, bw, bunit, gender);
    });

    return ret;
  }

  var calcScore = function (data, repMax, UnitConverter, gender) {
// data is in reverse date order, hence first.
    // Hope that contract never changes!
    var bw = _.first(data).body.weight;
    var bunit = _.first(data).body.unit;

    return calcScore2(repMax, UnitConverter, bw, bunit, gender);
  };

  var calcScores = function(data, repMax, UnitConverter, gender) {
    if (data.length > 0) {
      var scores = calcScore(data, repMax, UnitConverter, gender);
      scores = scores.map(scoreToGame);
      return scores;
    }
    else {
      return [];
    }
  };

  var genDailyDates = function(minDate, maxDate) {
    var curDateObj = new Date(new Date(minDate).setUTCHours(0,0,0,0));
    var curDate = curDateObj.valueOf();
    var dates = [];
    while (curDate<=maxDate) {
      dates.push(new Date(curDate));
      curDateObj.setUTCDate(curDateObj.getUTCDate() + 1); // I hate mutable classes
      if (curDateObj.getUTCHours()!==0) {
        // debugger;
        // This is a code bug!
      }
      curDate = curDateObj.valueOf();
    }
    return dates;

  };

  var calcScoreHistory = function(userData, exname, daily, UnitConverter, gender) {
    gender = gender || 'm';
    var body = _.first(userData.data).body; // TODO: Technically, bw/bwunit should be historic
    var bw = body.weight;
    var bwunit = body.unit;

    var repMax = userData.stats.repMax;

    // Pointers into repMax[exname][i].history[ptr]
    // Need 1+5 entries, first is est1rm ignored
    var histPtr = [0,0,0,0,0,0];
    var repMaxEx = repMax[exname];
    var dirty=1;
    var cleanVal=0;

    return daily.map(function(curDate){
      // Update histPtr
      for (var i=1; i<=5; i++) {
        var nexthist = repMaxEx[i].history[histPtr[i]+1];
        if (nexthist && nexthist.date <= curDate ) {
          histPtr[i]++; // Next hist item counts
          dirty++;
        }
      }
      // Construct current repMax. (First entry is garbage)
      var repMaxEntry = _.range(0,6).map(function(x){
        return {latest:repMaxEx[x].history[histPtr[x]]};
      });

      if (dirty) {
        var scoreObj = calcScoreForExercise(repMaxEntry, UnitConverter, exname, bw, bwunit, gender);
        cleanVal = scoreObj.avgScore;
      }
      dirty = 0;
      return cleanVal;

    });
  };

  var calcScoreHistoryTable = function(curr, UnitConverter) {
    if (!curr.data.length) {
      return null;
    }

    var items = curr.data;
    var byDate = _.groupBy(items, function(item){return new Date(item.date).setUTCHours(0,0,0,0).valueOf(); });
    var allDates = _.keys(byDate).map(function(x){return +x;});
    var minDate = _.min(allDates);
    var maxDate = _.max(allDates);
    var daily = genDailyDates(minDate, maxDate);
    var columnar = [daily];

    var cols = [];
    cols.push(['date','Date']);

    var POWER_LIFTS = ['Barbell Squat','Barbell Bench Press','Barbell Deadlift'];
    POWER_LIFTS.forEach(function(exname){
      columnar.push(calcScoreHistory(curr, exname, daily, UnitConverter, 'm'));
      cols.push(['number',exname]);
    });

    var rows = _.zip.apply(_, columnar);
    return {cols:cols, data:columnar, rows:rows};
  };


  return {
            genRepMaxFull : genRepMaxFull,
            genRepMaxHistory : genRepMaxHistory,
          calcScores:calcScores,
          calcScoreForExercise:calcScoreForExercise,
    calcScoreHistoryTable:calcScoreHistoryTable
        };
}));
