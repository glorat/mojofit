'use strict';

(function( myService){

    if (typeof module !== 'undefined' && module.exports ) {
        module.exports = myService(require('./repMaxCalculator'), require('underscore'), require('./unitConverter'));
    } else if( angular) {
        angular.module('clientApp')
            .factory('fitViewProcessor', function(RepMaxCalculator, UnitConverter){
                return myService(RepMaxCalculator, _, UnitConverter);
            });
    } else {

        // Die?
        // window.myService = myService;
    }

}(function(RepMaxCalculator, _, UnitConverter){
    var defaultExercises = ['Barbell Squat', 'Standing Barbell Shoulder Press (OHP)', 'Barbell Bench Press', 'Barbell Deadlift', 'Pendlay Row', 'Power Clean', 'Pull-Up', 'Front Barbell Squat', 'Standing Dumbbell Shoulder Press', 'Barbell Curl', 'Cable External Rotation', 'Hang Clean', 'Clean and Jerk', 'Lat Pulldown', 'Hang Power Clean', 'Clean', 'Dips - Triceps Version', 'Face Pull', 'Dumbbell Bicep Curl', 'Plank', 'Goblet Squat (dumbbell)', 'Bent Over Barbell Row', 'Body Weight Glute Hamstring Raise', 'Front Squat', 'Power Snatch', 'Dumbbell Bulgarian Split Squat', 'Push-Up', 'Dumbbell Side Lateral Raise', 'Farmer\'s Walk', 'Abductor Machine', 'Overhead Barbell Squat', 'Bent-Over Rear Delt Raise', 'Front Dumbbell Raise', 'One-Arm Dumbbell Row', 'Barbell Shrug', 'Seated Bent-Over Rear Delt Raise', 'Seated Cable Row', 'Chin-Up', 'Snatch'];


    var usedExercises = function (data) {
        //var nameByUse = {};
        var x = _.chain(data)
            .map(function(d){return d.actions;})
            .flatten()
          .filter(function(d){return d !== undefined;})
            .countBy(function(d){return d.name;})
            .pairs()
            .sortBy(function (d){return -d[1];})
            .filter(function(d){return d[1]>1;})
            .map(function(d){return d[0];})
            .value();
        var other = _.without(defaultExercises, x);
        return _.union(x, other);
        // return x;
    };

  var processItem = function(item){
    // And do some name mappings
    // TODO: Make this a user pref
    var aliases = {'Bench Press':'Barbell Bench Press', 'Row':'Pendlay Row'};
    item.date = parseInt(item.date);
    var dt = new Date(item.date);
    dt.setUTCHours(0,0,0,0);
    item.date = dt.valueOf(); // Fixup bad dates
    item.localDate = new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()); // For display
    if (item.actions) {
      item.actions.map(function(action){
        if (aliases[action.name]) {
          action.name = aliases[action.name];
        }
        action.sets.map(function(set){
          set.reps = +set.reps;
          set.weight = +set.weight;
        });
      });
      return item;
    }};

    var processData = function (data) {
        // Too many strings in the data
        data.map(processItem);

        data.sort(function(a,b) {
            if (b.date < a.date) { return -1; }
            if (b.date > a.date) { return 1; }
            return 0;
        });
        // Inject index
        for (var i=0; i<data.length; i++) {
          data[i].index = i;
        }

        return data;
    };

    var createSetBadgeMap = function(items, repMaxByName) {
        var badges = {
            sets:[],
            badges:[],
            addBadge : function(wset, badge) {
                var i =_.indexOf(this.sets, wset);
                if (i === -1) {
                    i = this.sets.length;
                    this.sets.push(wset);
                    this.badges.push([badge]);
                }
                else {
                    this.sets[i] = wset;
                    this.badges[i].push(badge);
                }
            },
            get : function(wset) {
                var i =_.indexOf(this.sets, wset);
                if (i===-1) {
                    return [];
                }
                else {
                    return this.badges[i];
                }
            }
        };
        var attachOneRepMaxToItems = function(exname) {
            var repMaxes = repMaxByName[exname];
            repMaxes.forEach(function(repMaxItem){
                var tag = repMaxItem.reps + 'RM';
                var l = repMaxItem.latest;
                if (l.weight >0) {
                    var item = _.find(items, function (x){return x.date=== l.date;});
                    var action = _.find(item.actions,function(x){return x.name === exname;});
                    var set = _.find(action.sets, function(x){return x.weight=== l.weight && x.reps=== l.reps;});
                    if (set) {
                        badges.addBadge(set, tag);
                        // console.log(new Date(item.date) + ' ' + exname + ' ' + l.weight + 'x' + l.reps);
                    }
                    else {
                        console.log('Could not find set for ' + exname);
                        console.log(l);
                    }
                }
            });

        };
        var exs = _.keys(repMaxByName);
        exs.forEach(attachOneRepMaxToItems);
        return badges;
    };

    var utcDateToLocal = function(d) {
      var d1 = new Date(d);
      var d2 = new Date(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate());
      return d2;
    };

    var copyUserInto = function(dataObj, userData) {
        var data = dataObj.items;
        userData.revision = +dataObj.revision;
        userData.data = processData(data);
        userData.plan = dataObj.plan ? processItem(dataObj.plan) : undefined;
        userData.usedExercises = usedExercises(data);
        userData.workoutDates = userData.data.map(function(x){return utcDateToLocal(x.date).valueOf();});
        userData.activeDate = new Date(userData.workoutDates[0]);
        userData.showChart = true;
        userData.prefs = dataObj.prefs;
        userData.stats = {};
        userData.stats.repMax = RepMaxCalculator.genRepMaxFull(userData.data, userData.usedExercises, dataObj.prefs.preferredUnit || 'kg');
        userData.stats.strengthScore = RepMaxCalculator.calcScores(userData.data, userData.stats.repMax, UnitConverter, userData.prefs.gender);
        userData.stats.strengthHistory = RepMaxCalculator.calcScoreHistoryTable(userData, UnitConverter);
        userData.setBadges = createSetBadgeMap(userData.data, userData.stats.repMax);

        userData.data.forEach(function(item){
          var f = _.find(userData.stats.strengthHistory.rows, function(x){return x[0].valueOf()===item.date.valueOf();});
          if (f) {
            item.scores = f;
          }
          else {
            // This shouldn't happen. FIXME: Warn?
            // debugger;
          }
        });
    };

    return {
        defaultExercises : defaultExercises,
        usedExercises : usedExercises,
        processData : processData,
        createSetBadgeMap : createSetBadgeMap,
        copyUserInto : copyUserInto
    };
}));
