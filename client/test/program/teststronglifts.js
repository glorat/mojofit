'use strict';

var assert = require('assert');

var sl = require('../../app/scripts/program/stronglifts.js');

describe('Stronglifts', function() {
  describe('Starting from zero', function(){
    var state = {data:[]};

    it ('should do workout A with empty bar', function() {
      var x = sl.chooseWorkout(state);
      assert.equal('A',x);
      var neww = sl.applyWorkout(x, state);

      assert.equal(3, neww.actions.length);
      assert.equal('Barbell Squat', neww.actions[0].name);
      assert.equal('Barbell Bench Press', neww.actions[1].name);
      assert.equal(5, neww.actions[0].sets.length);
      assert.equal(5, neww.actions[0].sets[0].reps);
      assert.equal(20, neww.actions[0].sets[0].weight);

      state.data.unshift(neww);

      x = sl.chooseWorkout(state);
      assert.equal('B',x);
      neww = sl.applyWorkout(x, state);
      assert.equal(3, neww.actions.length);
      assert.equal('Barbell Squat', neww.actions[0].name);
      assert.equal('Barbell Deadlift', neww.actions[2].name);
      assert.equal(5, neww.actions[0].sets.length);
      assert.equal(5, neww.actions[0].sets[0].reps);
      assert.equal(20, neww.actions[0].sets[0].weight);
      assert.equal(40, neww.actions[2].sets[0].weight);

      state.data.unshift(neww);
      x = sl.chooseWorkout(state);
      assert.equal('A',x);
      neww = sl.applyWorkout(x, state);

      assert.equal(3, neww.actions.length);
      assert.equal('Barbell Squat', neww.actions[0].name);
      assert.equal('Barbell Bench Press', neww.actions[1].name);
      assert.equal(5, neww.actions[0].sets.length);
      assert.equal(5, neww.actions[0].sets[0].reps);
      assert.equal(25, neww.actions[0].sets[0].weight);
      // Let's fail a rep already
      neww.actions[0].sets[4].reps = 4;

      state.data.unshift(neww);
      x = sl.chooseWorkout(state);
      assert.equal('B',x);
      neww = sl.applyWorkout(x, state);
      assert.equal(3, neww.actions.length);
      assert.equal('Barbell Squat', neww.actions[0].name);
      assert.equal('Barbell Deadlift', neww.actions[2].name);
      assert.equal(5, neww.actions[0].sets.length);
      assert.equal(5, neww.actions[0].sets[0].reps);
      assert.equal(25, neww.actions[0].sets[0].weight); // SQ stayst he same
      assert.equal(45, neww.actions[2].sets[0].weight); // DL went up though


    });
  });

});
