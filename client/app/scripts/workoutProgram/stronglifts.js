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

  var generateStrongLiftsProgram = function(ID, NAME) {
    var paramSchema = [
      ['Variant','choice',[
        {id:'5x5',label:'5x5'},
        {id:'3x5',label:'3x5'},
        {id:'3x3',label:'3x3'}
      ]],
      ['Squat','weight'],
      ['Bench','weight'],
      ['Deadlift','weight'],
      ['Press','weight'],
      ['Row','weight'],
      ['Date','utcdate']
    ].map(function(i){
        return {field:i[0], type:i[1], opts:i[2]};
      });

    var SQ = 'Barbell Squat';
    var BP = 'Barbell Bench Press';
    var DL = 'Barbell Deadlift';
    var OP = 'Standing Barbell Shoulder Press (OHP)';
    var BR = 'Pendlay Row';
    var FROMALIAS = {
      'Squat': SQ,
      'Bench': BP,
      'Deadlift': DL,
      'Press': OP,
      'Row': BR
    };
    var TOALIAS = _.invert(FROMALIAS);

    var ALL = [SQ, BP, DL, OP, BR];
    var ALLALIAS = ALL.map(function (ex) {
      return TOALIAS[ex];
    });

    // TODO: Make this user configurable
    var kgcfg = {};
    kgcfg['Squat'] = {incr: 2.5, init: 20};
    kgcfg['Deadlift'] = {incr: 5, init: 40};
    kgcfg['Bench'] = {incr: 2.5, init: 20};
    kgcfg['Press'] = {incr: 2.5, init: 20};
    kgcfg['Row'] = {incr: 2.5, init: 30};
    var lbcfg = {};
    lbcfg['Squat'] = {incr: 5, init: 45};
    lbcfg['Deadlift'] = {incr: 10, init: 95};
    lbcfg['Bench'] = {incr: 5, init: 45};
    lbcfg['Press'] = {incr: 5, init: 45};
    lbcfg['Row'] = {incr: 5, init: 65};


    var cfg = {'kg': kgcfg, 'lb': lbcfg};

    var workoutChooser = function (state) {
      var lastSL = _.find(state.data, function (d) {
        return d.program === NAME;
      });
      var newW = lastSL ? ( (lastSL.workout === 'A') ? 'B' : 'A') : 'A';
      return newW;
    };

    var setsFor = function(exname, params) {
      return (exname === 'Deadlift') ? 1 : +params.Variant.value.split('x')[0];
    };

    var updateParams = function (item, origParams) {
      // Be careful not to actually update anything inside origParams
      var params = _.clone(origParams);
      var s = params.Variant.value.split('x');
      var repCount = +s[1];
      var unit = 'kg';
      ALLALIAS.forEach(function (exname) {
        var lastAct = _.find(item.actions, function (a) {
          return a.name === FROMALIAS[exname];
        });
        if (lastAct) {
          var inKgs = lastAct.sets.map(function (s) {
            return UnitConverter.convert(s.weight, s.unit, 'kg');
          });
          var maxKg = _.max(inKgs);
          // How many sets got 5 reps at this weight?
          var goodsets = _.filter(lastAct.sets, function (s) {
            return (s.reps) && (s.weight) && (s.reps >= repCount) && (maxKg === UnitConverter.convert(s.weight, s.unit, 'kg'));
          });
          if (goodsets.length >= setsFor(exname,params)) {
            // Nx5 completed
            params[exname] = _.clone(params[exname]);
            params[exname].weight = UnitConverter.convert(maxKg, 'kg', unit) + cfg[unit][exname].incr;
          }
          // TODO: Detect if failed 3 times to deload!
        }
      });

      // Finally bring up the date
      params.Date = _.clone(params.Date);
      params.Date.value = item.date;

      return params;
    };

    function genActionFromParam(param, ex) {
      var s = param.Variant.value.split('x');
      var repCount = +s[1];
      var unit = param[ex].unit;
      var wgt = param[ex].weight;
      // Generate 5 sets
      var setN = setsFor(ex,param);
      var sets = _.range(setN).map(function () {
        // with 5 reps
        return {reps: repCount, weight: wgt, unit: unit};
      });
      return {name: FROMALIAS[ex], sets: sets};
    }

    function defaultParam(state, defaultUnit) {
      var param = {};
      ALL.forEach(function (exname) {
        var exalias = TOALIAS[exname];
        param[exalias] = {
          unit: defaultUnit,
          weight: cfg[defaultUnit][exalias].init
        };
      });

      var dt = new Date(0);
      dt.setUTCHours(0, 0, 0, 0);

      param.Date = {
        value: dt.valueOf()
      };
      param.Variant = {value:'5x5'};
      return param;
    }

    var genParams = function (state, param) {
      var inScopeData = _.filter(state.data, function (item) {
        return item.date > param.Date.value;
      });

      // Go in reverse
      // FIXME: Explict order inScopeData by date
      for (var i = inScopeData.length - 1; i >= 0; i--) {
        param = updateParams(inScopeData[i], param);
      }
      return param;
    };


    var genWorkout = function (exs, state, param) {
      param = genParams(state, param);

      return exs.map(function (ex) {
        return genActionFromParam(param, ex);
      });
    };

    var workoutA = {
      name: 'A',
      description: 'Squat/Bench/Row',
      generate: function (state, dt, param) {
        var exs = ['Squat', 'Bench', 'Row'];
        var actions = genWorkout(exs, state, param);
        return {date: dt, actions: actions, program: NAME, workout: 'A'};
      }
    };

    var workoutB = {
      name: 'B',
      description: 'Squat/Press/Deadlift',
      generate: function (state, dt, param) {
        var exs = ['Squat', 'Press', 'Deadlift'];
        var actions = genWorkout(exs, state, param);
        return {date: dt, actions: actions, program: NAME, workout: 'B'};
      }
    };

    var applyWorkout = function (wname, state, dt, param) {
      var defaultUnit = 'kg';
      param = param || defaultParam(state, defaultUnit);
      if (wname === 'B') {
        return workoutB.generate(state, dt, param);
      }
      else {
        return workoutA.generate(state, dt, param);
      }
    };

    var program = {
      id: ID,
      name: NAME,
      chooseWorkout: workoutChooser,
      availableWorkouts: ['A', 'B'],
      paramSchemaByField : function(){return _.indexBy(paramSchema, function(p){return p.field;});},
      paramKeys : function(){return paramSchema.map(function(p){return p.field;});},
      defaultParam: defaultParam,
      applyWorkout: applyWorkout
    };

    ProgramRegistry.registerProgram(program);

    return program;
  };

  return generateStrongLiftsProgram('stronglifts','Stronglifts 5x5', 5,5);


}));
