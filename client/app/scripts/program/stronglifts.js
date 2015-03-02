'use strict';

(function( myService){

  if (typeof module !== 'undefined' && module.exports ) {
    module.exports = myService(require('../mojofit/unitConverter'), require('./registry'), require('underscore'));
  } else if( angular) {
    angular.module('clientApp')
      .factory('Stronglifts', function(UnitConverter, ProgramRegistry){
        return myService(UnitConverter, ProgramRegistry, _);
      });
  } else {
    // Die?
    // window.myService = myService;
  }

}(function(UnitConverter, ProgramRegistry, _) {
  var NAME = 'Stronglifts 5x5';
  var SQ = 'Barbell Squat';
  var BP = 'Barbell Bench Press';
  var DL = 'Barbell Deadlift';
  var OP = 'Standing Barbell Shoulder Press (OHP)';
  var BR = 'Pendlay Row';

  // TODO: Make this user configurable
  var kgcfg = {};
  kgcfg[SQ] = {incr:2.5, init:20, sets:5};
  kgcfg[DL] = {incr:5, init:40, sets:1};
  kgcfg[BP] = {incr:2.5, init:20, sets:5};
  kgcfg[OP] = {incr:2.5, init:20, sets:5};
  kgcfg[BR] = {incr:2.5, init:30, sets:5};
  var lbcfg = {};
  lbcfg[SQ] = {incr:5, init:45, sets:5};
  lbcfg[DL] = {incr:10, init:95, sets:1};
  lbcfg[BP] = {incr:5, init:45, sets:5};
  lbcfg[OP] = {incr:5, init:45, sets:5};
  lbcfg[BR] = {incr:5, init:65, sets:5};


  var cfg = {'kg': kgcfg, 'lb':lbcfg};

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
    var inKgs = lastAct.sets.map(function(s){return UnitConverter.convert(s.weight, s.unit, 'kg');});
    var maxKg = _.max(inKgs);
    // How many sets got 5 reps at this weight?
    var goodsets = _.filter(lastAct.sets, function(s){
      return (s.reps) && (s.weight) && (s.reps >= 5) && (maxKg === UnitConverter.convert(s.weight, s.unit, 'kg'));
    });
    if (goodsets.length >= cfg[unit][exname].sets) { // Nx5 completed
      return maxKg + cfg[unit][exname].incr;
    }
    // Retry weight
    // TODO: Detect if failed 3 times to deload!
    return maxKg;
  };

  function genWorkout(exs, state) {
    var unit = 'kg';
    return exs.map(function (ex) {
      var lastSLA = _.find(state.data, function(d){return d.program === NAME && _.find(d.actions, function(a){return a.name === ex;})});
      var wgt = nextWeightChooser(lastSLA, ex, unit);
      // Generate 5 sets
      var setN = cfg[unit][ex].sets;
      var sets = _.range(setN).map(function () {
        // with 5 reps
        return {reps: 5, weight: wgt, unit: unit};
      });
      return {name: ex, sets: sets};
    });
  }

  var workoutA = {
    name : 'A',
    description : 'Squat/Bench/Row',
    generate : function(state) {
      var exs = [SQ, BP, BR];
      var actions = genWorkout(exs, state);
      return {actions:actions, program:NAME, workout:'A'};
    }
  };

  var workoutB = {
    name : 'B',
    description : 'Squat/Press/Deadlift',
    generate : function(state) {
      var exs = [SQ, OP, DL];
      var actions = genWorkout(exs, state);
      return {actions:actions, program:NAME, workout:'B'};
    }
  };

  var applyWorkout = function(wname, state) {
    if (wname==='B') {
      return workoutB.generate(state);
    }
    else {
      return workoutA.generate(state);
    }
  };

  var program = {
    name : NAME,
    chooseWorkout : workoutChooser,
    availableWorkouts : ['A','B'],
    applyWorkout : applyWorkout
  };

  ProgramRegistry.registerProgram(program);

  return program;

}));
