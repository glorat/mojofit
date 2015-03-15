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
  var programList = [], programWorkoutNames = {};

  var registerProgram = function(program) {
    programs.push(program);
    // Eagerly compute
    programList = programs.map(function(p){return {id: p.id, name:p.name};});
    programWorkoutNames[program.id] = program.availableWorkouts;
  };

  return {
    registerProgram : registerProgram,
    listPrograms : function(){return programList;},
    listWorkouts: function(id) {return programWorkoutNames[id];},
    getProgram: function(nm){return _.find(programs, function(p){return p.id ===nm;});}
  };

}));
