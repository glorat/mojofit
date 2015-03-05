'use strict';

(function( myService){

  if (typeof module !== 'undefined' && module.exports ) {
    module.exports = myService(require('underscore'));
  } else if( angular) {
    angular.module('workoutProgram')
      .factory('ProgramRegistry', function(){
        return myService(_);
      });
  } else {
    // Die?
    // window.myService = myService;
  }

}(function(_) {
  var programs = [];
  var programNames = [], programWorkoutNames = {};

  var registerProgram = function(program) {
    programs.push(program);
    // Eagerly compute
    programNames = programs.map(function(p){return p.name;});
    programWorkoutNames[program.name] = program.availableWorkouts;
  };

  return {
    registerProgram : registerProgram,
    listPrograms : function(){return programNames;},
    listWorkouts: function(p) {return programWorkoutNames[p];},
    getProgram: function(nm){return _.find(programs, function(p){return p.name ===nm;});}
  };

}));