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
      assert.equal(5, neww.actions[0].sets.length);
      assert.equal(5, neww.actions[0].sets[0].reps);
      assert.equal(20, neww.actions[0].sets[0].weight);
    });
  });

});
