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
    .factory('PlateCalculator', function (KnapSack, UnitConverter, localStorageService, $log) {

        // Maintain state here
        var defaultPlates = [[25,0,'kg'],[20,6,'kg'],[15,6,'kg'],[10,6,'kg'],[5,6,'kg'],[2.5,6,'kg'],[1.25,1,'kg']];

        var initPlates = function() {
            var ls = localStorageService.get('plates');
            if (ls) {
                return ls;
            }
            else {
                return angular.copy(defaultPlates);
            }
        };
        var toKgPlates = function() {
            return myPlates.map(function (x) {return [UnitConverter.convert(x[0],x[2],'kg'), x[1]];});
        };

        var myPlates = initPlates();
        var myTable = KnapSack.solve(toKgPlates(myPlates));

        var totalPlates = function() {
            var sum = 0;
            _.chain(myPlates)
                .map(function(x){return x[1];})
                .each(function(x){sum+=x;})
                .value();
            return sum;
        };



        var doSolve = function() {
            if (totalPlates() > 40) {
                $log.error('Tried to solve for too many plates!');
            }
            else {
                localStorageService.set('plates',myPlates);
                myTable = KnapSack.solve(toKgPlates(myPlates));
            }

        };

        var getSolutionFor = function(weight, unit) {
            var kg = UnitConverter.convert(weight, unit, 'kg');
            return KnapSack.getSolutionFor(myTable, kg);
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
        this.solutionTotal = 0;
        var refresh = function() {
            self.solution = PlateCalculator.getSolutionFor(self.weight, self.unit);
        };
        this.solve = function() {
            PlateCalculator.solve();
            refresh();
        };
        // On weight/unit change
        this.refresh = refresh;

        refresh();
    });