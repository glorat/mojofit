'use strict';

(function( myService){

  if (typeof module !== 'undefined' && module.exports ) {
    // FIXME: require('WorkoutState')
    var us = require('underscore');
    module.exports = myService(undefined, us);
  } else if( angular) {
    angular.module('clientApp')
      .factory('GymWorkflow', function(WorkoutState){
        return myService(WorkoutState, _);
      });
  } else {
    // Die?
    // window.myService = myService;
  }

}(function (WorkoutState, _) {
  var self = {};
  self.workItems = undefined;
  self.workIndex = 0;
  self.timerStart = Date.now();

  function workoutToWorkflow(workout) {
    var items = [];
    var lastAction = {};
    var lastSet = {};

    var doAction = function(action, ai) {

      var doSet = function(aset, si) {
        // items.push({type:'Setup', action:action, actionIndex:ai, set:aset, setIndex:si});
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

  /**
   * Reconstruct a list of actions from the workflow
   * We must be careful of all the JS copy by ref here
   * Most things won't be changed so we can copy by ref
   * But since workflow can add sets/actions, those are reconstructed
   */
  function workflowToActions() {
    var work = _.filter(self.workItems, function(w){return w.type==='Work';});
    var actions = [];
    var curAction = {name:'a nonce string', sets:[]};
    work.forEach(function(w){
      if (w.action.name !== curAction.name) {
        // New action to push
        curAction = w.action;
        actions.push(curAction);
        curAction.sets = [];
      }
      curAction.sets.push(w.set);
    });
    return actions;
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
    if (self.workItems[self.workIndex].type === 'Work') {
      // If you've just finished work, reset the timer!
      self.timerStart = Date.now();
    }

    if (self.hasNext()) {
      self.workIndex++;
    }
  };

  self.prev = function() {
    if (self.hasPrev()) {
      self.workIndex--;
    }
  };

  /** In seconds */
  self.timer = function() {
    return (Date.now() - self.timerStart)/1000;
  };

  self.toActions = workflowToActions;

  return self;

}));
