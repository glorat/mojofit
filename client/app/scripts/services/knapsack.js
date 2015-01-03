'use strict';

// Pure functional module
angular.module('clientApp')
    .factory('KnapSack', function () {
        // var demo2 = [[20,6],[15,6],[10,6],[5,6],[2.5,6],[1,1.25]];

        var enumerate2 = function(plates) {
            var ps = [[]];
            var weights=[0];
            var scores=[0];
            var byWeight = {};
            for (var i = 0, ilen = plates.length; i < ilen; i++) {
                for (var j = 0, len = ps.length; j < len; j++) {
                    for (var p= 1, plen=plates[i][1]; p<=plen; p++) {
                        var plate = plates[i];
                        var stack = ps[j].concat( [[plate[0],p]] );
                        ps.push(stack);
                        var weight = weights[j] + plate[0]*p;
                        weights.push(weight);
                        // scorefn
                        var score = scores[j] + (plate[0]*plate[0]*p);
                        scores.push(score);
                        if (byWeight[weight] && byWeight[weight].score > score) {
                            // Do nothing
                        }
                        else {
                            byWeight[weight] = {score:score, plates:stack};
                        }
                    }
                }
            }
            return _.chain(byWeight)
                .pairs()
                .map(function(x){return [+x[0], x[1].plates];})
                .sortBy(function(x){return +x[0];})
                .value();
        };

        var getSolutionForUnit = function(table, kg) {
            var gap = kg;
            var besti=0;
            for (var i=0; i<table.length;i++) {
                var newGap = Math.abs(table[i][0]-kg);
                if ( newGap < gap ) {
                    gap = newGap;
                    besti = i;
                }
                else {
                    return table[besti][1];
                }
            }
            return [];
        };

        return {
            solve : enumerate2,
            getSolutionFor: getSolutionForUnit
        };
    });

// Stateful module
angular.module('clientApp')
    .factory('PlateCalculator', function (KnapSack, UnitConverter, $log) {

        // Maintain state here
        var myPlates = [[20,6,'kg'],[15,6,'kg'],[10,6,'kg'],[5,6,'kg'],[2.5,6,'kg'],[1.25,1,'kg']];
        var myTable = [];

        var totalPlates = function() {
            return myPlates.map(function(x){return x[2];}).sum();
        };

        var toKgPlates = function() {
            return myPlates.map(function (x) {return [UnitConverter.convert(x[0],x[2],'kg'), x[1]];});
        };

        var doSolve = function() {
            if (totalPlates() > 40) {
                $log.error('Tried to solve for too many plates!');
            }
            else {
                myTable = KnapSack.solve(toKgPlates(myPlates));
            }

        };

        var getSolutionFor = function(weight, unit) {
            var kg = UnitConverter.convert(weight, unit, 'kg');
            return KnapSack.getSolutionForUnit(myTable, kg);
        };

        return {
            getPlates : function() {return myPlates;},
            solve : doSolve,
            getSolutionFor : getSolutionFor
        };
    });


// Stateful module
angular.module('clientApp')
    .factory('PlateCalculator', function (KnapSack, UnitConverter) {

        // Maintain state here
        var myPlates = [[20,6,'kg'],[15,6,'kg'],[10,6,'kg'],[5,6,'kg'],[2.5,6,'kg'],[1,1.25,'kg']];
        var myTable = [];
        var barbell = {weight:20, unit:'kg'};

        var toKgPlates = function() {
            return myPlates.map(function (x) {return [UnitConverter.convert(x[0],x[2],'kg'), x[1]];});
        };

        var doSolve = function() {
            myTable = KnapSack.solve(toKgPlates(myPlates));
        };

        var getSolutionFor = function(weight, unit) {
            var targetKg = UnitConverter.convert(weight, unit, 'kg');
            var barbellKg = UnitConverter.convert(barbell.weight, barbell.unit, 'kg');
            var toSolve = (targetKg - barbellKg) / 2.0; // Plates on 2 sides!
            return KnapSack.getSolutionFor(myTable, toSolve);
        };

        return {
            getPlates : function() {return myPlates;},
            solve : doSolve,
            getSolutionFor : getSolutionFor
        };
    });

angular.module('clientApp')
    .controller('PlateCalculatorController', function ($scope, PlateCalculator) {
        var self = this;
        this.plates = PlateCalculator.getPlates();
        this.weight = 120;
        this.unit = 'kg';
        this.solution = [];
        var refresh = function() {
            self.solution = PlateCalculator.getSolutionFor(self.weight, self.unit);
        };
        this.solve = function() {
            PlateCalculator.solve();
            refresh();
        };
        // On weight/unit change
        this.refresh = refresh;

    });