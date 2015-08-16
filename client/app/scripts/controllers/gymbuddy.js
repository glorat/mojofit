'use strict';


angular.module('clientApp')
  .controller('GymBuddyController', function (GymWorkflow, WorkoutState, PlateCalculator, $timeout, $interval) {
    var self = this;

    // This is the plan!
    // FIXME: This is volatile but actionIndex/setIndex don't reach. Do a watch?
    self.workout = WorkoutState.getWorkout();
    self.workIndex = 0;

    self.hasPrev = GymWorkflow.hasPrev;
    self.hasNext = GymWorkflow.hasNext;
    self.timer = 0;

    $interval(function() {
      self.timer = GymWorkflow.timer();
    }, 100);

    var relink = function() {
      self.workItem = GymWorkflow.workItems[GymWorkflow.workIndex];
      // TODO: Read docs on search method
      if (self.workItem &&
        (0===self.workItem.action.name.search('Barbell')) &&
        self.workItem.set &&
        self.workItem.set.weight) {
        var aset = self.workItem.set;
        self.plateSolution = PlateCalculator.getSolutionFor(aset.weight, aset.unit);
      }
      else {
        self.plateSolution = undefined;
      }
    };

    self.onPrev = function() {
      GymWorkflow.prev();
      relink();
    };

    self.onNext = function() {
      GymWorkflow.next();
      relink();
    };

    self.onDone = function() {
      // Set some state
      self.onNext();
    };

    self.onComplete = function() {
      window.alert('Not Implemented');
    };

    self.toActions = GymWorkflow.toActions;

    if (self.workout.actions.length > 0) {
      GymWorkflow.resetWorkflow();
      self.workItem = GymWorkflow.workItems[GymWorkflow.workIndex];
    }
    else {
      window.console.log('No action, try later');
      $timeout(function(){
        self.workout = WorkoutState.getWorkout();
        GymWorkflow.resetWorkflow();
        relink();
      }, 500);
    }

    return self;
  });
