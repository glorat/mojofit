'use strict';

(function( myService){

  if (typeof module !== 'undefined' && module.exports ) {
    module.exports = myService(require('./repMaxCalculator'), require('underscore'), require('./unitConverter'));
  } else if( angular) {
    angular.module('clientApp')
      .factory('WorkoutStats', function(RepMaxCalculator, _, UnitConverter){
        return myService();
      });
  } else {
    // Die?
    // window.myService = myService;
  }

}(function (RepMaxCalculator, _, UnitConverter) {


  var statsOf = function(userData) {
    // var withoutLatest = function()

    var itemsOrig = userData.data;
    var items = itemsOrig;
    var curDate = items[0].date;
    var repMax = RepMaxCalculator.genRepMaxFull(items, userData.usedExercises, userData.prefs.preferredUnit || 'kg');
    var nowStrength = RepMaxCalculator.calcScores(items, repMax, UnitConverter, userData.prefs.gender);
    var stats = {repMax: repMax, strengthScore:nowStrength};
    return stats;
  };

  var diffStats = function(statsBefore, statsAfter) {
    var stats = [];
    
  };

  return {};


}));
