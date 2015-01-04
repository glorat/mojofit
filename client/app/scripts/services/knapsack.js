'use strict';

// Pure functional module
angular.module('clientApp')
    .factory('KnapSack', function () {
        // var demo2 = [[20,6,'20kg'],[15,6,'15kg'],[10,6,'10kg'],[5,6,'5kg'],[2.5,6,'2.5kg'],[1,1.25,'1.25kg']];

        var enumerate2 = function(plates) {
            var ps = [[]];
            var weights=[0];
            var scores=[0];
            var byWeight = {};
            for (var i = 0, ilen = plates.length; i < ilen; i++) {
                for (var j = 0, len = ps.length; j < len; j++) {
                    for (var p= 1, plen=plates[i][1]; p<=plen; p++) {
                        var plate = plates[i];
                        var stack = ps[j].concat( [[plate[0],p,plate[2]]] );
                        ps.push(stack);
                        var weight = weights[j] + plate[0]*p;
                        weights.push(weight);
                        // scorefn
                        var score = scores[j] + (plate[0]*plate[0]*p);
                        scores.push(score);
                        var key = weight.toFixed(2); // Dodge numeric errors
                        if (byWeight[key] && byWeight[key].score > score) {
                            // Do nothing
                        }
                        else {
                            byWeight[key] = {score:score, plates:stack};
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

        var getSolutionFor = function(table, weight) {
            var gap = weight;
            var besti=0;
            for (var i=0; i<table.length;i++) {
                var newGap = Math.abs(table[i][0]-weight);
                if ( newGap < gap ) {
                    gap = newGap;
                    besti = i;
                }
                else {
                    return table[besti];
                }
            }
            return [];
        };

        return {
            solve : enumerate2,
            getSolutionFor: getSolutionFor
        };
    });

// Stateful module
angular.module('clientApp')
    .factory('PlateCalculator', function (KnapSack, UnitConverter, localStorageService, $log) {

        // Maintain state here
        var defaultPlates = [[25,0,'kg'],[20,6,'kg'],[15,6,'kg'],[10,6,'kg'],[5,6,'kg'],[2.5,6,'kg'],[1.25,1,'kg']];
        var defaultBarbell = {weight:20, unit:'kg'};

        var barbell;
        var myPlates;

        var initPlates = function() {
            var ls = localStorageService.get('plates');
            myPlates = (ls && ls.plates) ? ls.plates :  angular.copy(defaultPlates);
            barbell = (ls && ls.barbell) ? ls.barbell : angular.copy(defaultBarbell);
        };
        var toKgPlates = function() {
            return myPlates.map(function (x) {return [UnitConverter.convert(x[0],x[2],'kg'), x[1],x[0] + x[2]];});
        };

        initPlates();

        var myTable = KnapSack.solve(toKgPlates(myPlates));

        var resetPlates = function() {
            myPlates = angular.copy(defaultPlates);
            barbell = angular.copy(defaultBarbell);
        };

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
                localStorageService.set('plates',{plates:myPlates, barbell:barbell});
                myTable = KnapSack.solve(toKgPlates(myPlates));
            }

        };

        var getSolutionFor = function(weight, unit) {
            // Do all the maths in hk
            var targetKg = UnitConverter.convert(weight, unit, 'kg');
            var barbellKg = UnitConverter.convert(barbell.weight, barbell.unit, 'kg');
            var toSolve = (targetKg - barbellKg) / 2.0; // Plates on 2 sides!
            var solution = KnapSack.getSolutionFor(myTable, toSolve);
            var roundWeight = solution[0];
            var plateSolution = solution[1];
            var total = 0;
            //_.each(plateSolution, function(x){total+= x[0]*x[1]*2.0;});
            total+= roundWeight*2;
            total += barbellKg;
            // Convert the answers back to requested
            var solutionTotal = UnitConverter.convert(total,'kg',unit);
            return {
                solution:plateSolution,
                solutionTotal :solutionTotal
            };
        };

        return {
            getPlates : function() {return myPlates;},
            getBarbell : function() {return barbell;},
            reset : resetPlates,
            solve : doSolve,
            getSolutionFor : getSolutionFor
        };
    });

angular.module('clientApp')
    .controller('PlateCalculatorController', function ($scope, PlateCalculator) {
        var self = this;
        this.plates = PlateCalculator.getPlates();
        this.barbell = PlateCalculator.getBarbell();
        this.weight = 120;
        this.unit = 'kg';
        this.solution = [];
        this.solutionTotal = 0;
        var refresh = function() {
            var res = PlateCalculator.getSolutionFor(self.weight, self.unit);
            self.solution = res.solution;
            self.solutionTotal = res.solutionTotal;
        };
        this.solve = function() {
            PlateCalculator.solve();
            refresh();
        };
        // On weight/unit change
        this.refresh = refresh;
        this.reset = function() {
            PlateCalculator.reset();
            // Because of ref changes. Ugh
            this.plates = PlateCalculator.getPlates();
            this.barbell = PlateCalculator.getBarbell();
        };

        refresh();
    });