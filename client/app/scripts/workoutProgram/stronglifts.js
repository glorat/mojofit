'use strict';

(function( myService){

  if (typeof module !== 'undefined' && module.exports ) {
    module.exports = myService(require('../mojofit/unitConverter'), require('./registry'), require('underscore'));
  } else if( angular) {
    angular.module('workoutProgram')
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
  var ALL = [SQ, BP, DL, OP, BR];

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

  var updateParams = function(item, origParams) {
    // Be careful not to actually update anything inside origParams
    var params = _.clone(origParams);
    var unit = 'kg';
    ALL.forEach(function(exname) {
      var lastAct = _.find(item.actions, function(a){return a.name === exname;});
      if (lastAct) {
        var inKgs = lastAct.sets.map(function(s){return UnitConverter.convert(s.weight, s.unit, 'kg');});
        var maxKg = _.max(inKgs);
        // How many sets got 5 reps at this weight?
        var goodsets = _.filter(lastAct.sets, function(s){
          return (s.reps) && (s.weight) && (s.reps >= 5) && (maxKg === UnitConverter.convert(s.weight, s.unit, 'kg'));
        });
        if (goodsets.length >= cfg[unit][exname].sets) {
          // Nx5 completed
          params[exname] = _.clone(params[exname]);
          params[exname].weight = UnitConverter.convert(maxKg,'kg',unit) + cfg[unit][exname].incr;
        }
        // TODO: Detect if failed 3 times to deload!
      }
    });
    return params;
  };

  function genActionFromParam(param, ex) {
    var unit = param[ex].unit;
    var wgt = param[ex].weight;
    // Generate 5 sets
    var setN = cfg[unit][ex].sets;
    var sets = _.range(setN).map(function () {
      // with 5 reps
      return {reps: 5, weight: wgt, unit: unit};
    });
    return {name: ex, sets: sets};
  }

  function defaultParam(state,defaultUnit) {
    var param = {};
    ALL.forEach(function (exname) {
      param[exname] = {
        unit: defaultUnit,
        weight: cfg[defaultUnit][exname].init,
        type: 'weight'
      };
    });

    var dt = new Date(0);
    dt.setUTCHours(0,0,0,0);

    param.date = {
      value: dt.valueOf(),
      type: 'utcdate'
    };
    return param;
  }

  function genWorkout(exs, state, param) {
    var inScopeData = _.filter(state.data, function(item){return item.date>param.date.value;});

    // Go in reverse
    // FIXME: Explict order inScopeData by date
    for( var i =  inScopeData.length-1; i>= 0 ; i--){
      param = updateParams(inScopeData[i], param);
    }

    return exs.map(function (ex) {
      return genActionFromParam(param, ex);
    });
  }

  var workoutA = {
    name : 'A',
    description : 'Squat/Bench/Row',
    generate : function(state, dt, param) {
      var exs = [SQ, BP, BR];
      var actions = genWorkout(exs, state, param);
      return {date:dt, actions:actions, program:NAME, workout:'A'};
    }
  };

  var workoutB = {
    name : 'B',
    description : 'Squat/Press/Deadlift',
    generate : function(state, dt, param) {
      var exs = [SQ, OP, DL];
      var actions = genWorkout(exs, state, param);
      return {date:dt, actions:actions, program:NAME, workout:'B'};
    }
  };

  var applyWorkout = function(wname, state, dt, param) {
    var defaultUnit = 'kg';
    param = param || defaultParam(state,defaultUnit);
    if (wname==='B') {
      return workoutB.generate(state, dt, param);
    }
    else {
      return workoutA.generate(state, dt, param);
    }
  };

  var program = {
    name : NAME,
    chooseWorkout : workoutChooser,
    availableWorkouts : ['A','B'],
    defaultParam : defaultParam,
    applyWorkout : applyWorkout
  };

  ProgramRegistry.registerProgram(program);

  return program;

}));
