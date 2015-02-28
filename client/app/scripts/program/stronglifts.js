'use strict';

(function( myService){

  if (typeof module !== 'undefined' && module.exports ) {
    module.exports = myService(require('../mojofit/unitConverter'), require('underscore'));
  } else if( angular) {
    angular.module('clientApp')
      .factory('stronglifts', function(UnitConverter){
        return myService(UnitConverter, _);
      });
  } else {
    // Die?
    // window.myService = myService;
  }

}(function(UnitConverter, _) {
  var NAME = 'Stronglifts 5x5';
  var SQ = 'Barbell Squat';
  var BP = 'Barbell Bench Press';
  var DL = 'Barbell Deadlift';
  var OP = 'Standing Barbell Shoulder Press (OHP)';
  var BR = 'Pendlay Row';

  // TODO: Make this user configurable
  var kgcfg = {};
  kgcfg[SQ] = {incr:5, init:20};
  kgcfg[DL] = {incr:5, init:40};
  kgcfg[BP] = {incr:2.5, init:20};
  kgcfg[OP] = {incr:2.5, init:20};
  kgcfg[BR] = {incr:2.5, init:20};

  var cfg = {'kg': kgcfg};

  var workoutChooser = function(state) {
    var lastSL = _.find(state.data, function(d){return d.program === NAME;});
    var newW = lastSL ? ( (lastSL.workout==='A') ? 'B' : 'A') : 'A';
    return newW;
  };

  var nextWeightChooser = function(last, exname, unit) {
    unit = 'kg'; // FIXME: sorry
    if (!last) {
      return cfg[unit][exname].init;
    }
    // This will only pick up the first matching action... don't split your actions within the same exname
    var lastAct = _.find(last.actions, function(a){return a.name === exname;});
    var maxWeight = _.max(lastAct.sets, function(s){return s.foo;});
    return maxWeight;
  };

  var workoutA = {
    name : 'A',
    description : 'Squat/Bench/Row',
    generate : function(state) {
      var lastSLA = _.find(state.data, function(d){return d.program === NAME && d.workout==='A';});
      var exs = [SQ, BP, BR];
      var actions = exs.map (function (ex) {
        var wgt = nextWeightChooser(lastSLA, ex, 'kg');
        // Generate 5 sets
        var sets = _.range(5).map(function() {
          // with 5 reps
          return {reps:5, weight:wgt, unit:'kg'};
        });
        return {name:ex, sets:sets};
      });
      return {actions:actions, program:NAME, workout:'A'};
    }
  };

  var applyWorkout = function(wname, state) {
    if (wname==='B') {
      return null;
    }
    else {
      return workoutA.generate(state);
    }
  };

  return {
    chooseWorkout : workoutChooser,
    availableWorkouts : ['A','B'],
    applyWorkout : applyWorkout
  };

}));
