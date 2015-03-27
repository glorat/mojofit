'use strict';

(function( myService){

  if (typeof module !== 'undefined' && module.exports ) {
    // FIXME: require('WorkoutState')

    module.exports = myService(undefined);
  } else if( angular) {
    angular.module('clientApp')
      .factory('GymWorkflow', function(WorkoutState){
        return myService(WorkoutState);
      });
  } else {
    // Die?
    // window.myService = myService;
  }

}(function (WorkoutState) {
  var self = {};
  self.workItems = undefined;
  self.workIndex = 0;

  function workoutToWorkflow(workout) {
    var items = [];
    var lastAction = {};
    var lastSet = {};

    var doAction = function(action, ai) {

      var doSet = function(aset, si) {
        items.push({type:'Setup', action:action, actionIndex:ai, set:aset, setIndex:si});
        items.push({type:'Work', action:action, actionIndex:ai, set:aset, setIndex:si});
        items.push({type:'Feedback', action:action, actionIndex:ai, set:aset, setIndex:si}); // Feedback resets timer
        lastSet = aset;
      };

      items.push({type:'Begin', action: action, actionIndex:ai});

      for (var si=0; si<action.sets.length; si++) {
        doSet(action.sets[si], si);
      }
      lastAction = {};
    };

    for (var ai= 0; ai<workout.actions.length; ai++) {
      doAction(workout.actions[ai], ai);
    }
    return items;
  }

  function resetWorkflow() {
    var workout = WorkoutState.getWorkout();
    self.workItems = workoutToWorkflow(workout);
  }

  self.resetWorkflow = resetWorkflow;

  self.hasPrev = function() {
    return self.workItems && self.workIndex > 0;
  };


  self.hasNext = function() {
    return self.workItems && self.workIndex < self.workItems.length-1;
  };

  self.next = function() {
    if (self.hasNext()) {
      self.workIndex++;
    }
  };

  self.prev = function() {
    if (self.hasPrev()) {
      self.workIndex--;
    }
  };

  return self;

}));
