'use strict';

var assert = require('assert');
var _ = require('underscore');
var ProgramRegistry = require('../../app/scripts/workoutProgram/registry.js');
var sl = require('../../app/scripts/workoutProgram/stronglifts.js');

describe('Stronglifts', function() {
  describe('Registration', function(){
    it('should be a registered program', function() {
      assert.ok(_.contains(ProgramRegistry.listPrograms(), 'Stronglifts 5x5'));
      var avail = ProgramRegistry.listWorkouts('Stronglifts 5x5');
      assert.equal(avail[0], 'A');
      assert.equal(avail[1], 'B');
    });
  });

  describe('Starting from zero', function(){
    var state = {data:[]};

    it ('should do workout A with empty bar', function() {
      var x = sl.chooseWorkout(state);
      var dt = new Date().setUTCHours(0).valueOf();
      assert.equal('A',x);
      var neww = sl.applyWorkout(x, state, dt);

      assert.equal(neww.actions.length, 3);
      assert.equal(neww.actions[0].name, 'Barbell Squat');
      assert.equal(neww.actions[1].name, 'Barbell Bench Press');
      assert.equal(neww.actions[0].sets.length, 5);
      assert.equal(neww.actions[0].sets[0].reps, 5);
      assert.equal(neww.actions[0].sets[0].weight, 20);

      state.data.unshift(neww);

      x = sl.chooseWorkout(state);
      assert.equal('B',x);
      neww = sl.applyWorkout(x, state, dt);
      assert.equal(neww.actions.length, 3);
      assert.equal('Barbell Squat', neww.actions[0].name);
      assert.equal('Barbell Deadlift', neww.actions[2].name);
      assert.equal(neww.actions[0].sets.length, 5);
      assert.equal(neww.actions[0].sets[0].reps, 5);
      assert.equal(neww.actions[0].sets[0].weight, 22.5, 'SQ goes up');
      assert.equal(neww.actions[2].sets[0].weight, 40, 'DL on init');

      state.data.unshift(neww);
      x = sl.chooseWorkout(state);
      assert.equal('A',x);
      neww = sl.applyWorkout(x, state, dt);

      assert.equal(neww.actions.length, 3);
      assert.equal('Barbell Squat', neww.actions[0].name);
      assert.equal('Barbell Bench Press', neww.actions[1].name);
      assert.equal(neww.actions[0].sets.length, 5);
      assert.equal(neww.actions[0].sets[0].reps, 5);
      assert.equal(neww.actions[0].sets[0].weight, 25, 'SQ goes up again');
      // Let's fail a rep already
      neww.actions[0].sets[4].reps = 4;

      state.data.unshift(neww);
      x = sl.chooseWorkout(state);
      assert.equal('B',x);
      neww = sl.applyWorkout(x, state, dt);
      assert.equal(3, neww.actions.length);
      assert.equal('Barbell Squat', neww.actions[0].name);
      assert.equal('Barbell Deadlift', neww.actions[2].name);
      assert.equal(neww.actions[0].sets.length, 5);
      assert.equal(neww.actions[0].sets[0].reps, 5);
      assert.equal(neww.actions[0].sets[0].weight, 25, 'SQ stays the same');
      assert.equal(neww.actions[2].sets[0].weight, 45, 'DL went up anyway');


    });
  });

});
