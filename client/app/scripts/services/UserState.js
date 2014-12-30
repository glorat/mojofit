'use strict';


angular.module('clientApp')
    .factory('UserState', function ($http, $log, MojoServer, localStorageService) {

        var userStatus = MojoServer.getUserStatus();

        var defaultExercises = ['Barbell Squat', 'Standing Barbell Shoulder Press (OHP)', 'Barbell Bench Press', 'Barbell Deadlift', 'Pendlay Row', 'Power Clean', 'Pull-Up', 'Front Barbell Squat', 'Standing Dumbbell Shoulder Press', 'Barbell Curl', 'Cable External Rotation', 'Hang Clean', 'Clean and Jerk', 'Lat Pulldown', 'Hang Power Clean', 'Clean', 'Dips - Triceps Version', 'Face Pull', 'Dumbbell Bicep Curl', 'Plank', 'Goblet Squat (dumbbell)', 'Bent Over Barbell Row', 'Body Weight Glute Hamstring Raise', 'Front Squat', 'Power Snatch', 'Dumbbell Bulgarian Split Squat', 'Push-Up', 'Dumbbell Side Lateral Raise', 'Farmer\'s Walk', 'Abductor Machine', 'Overhead Barbell Squat', 'Bent-Over Rear Delt Raise', 'Front Dumbbell Raise', 'One-Arm Dumbbell Row', 'Barbell Shrug', 'Seated Bent-Over Rear Delt Raise', 'Seated Cable Row', 'Chin-Up', 'Snatch'];

        var currentUser = {userId:undefined, data:[], usedExercises:defaultExercises};


        var usedExercises = function (data) {
            //var nameByUse = {};
            var x = _.chain(data)
                .map(function(d){return d.actions;})
                .flatten()
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

        var processData = function (data) {
            // And do some name mappings
            // TODO: Make this a user pref
            var aliases = {'Bench Press':'Barbell Bench Press', 'Row':'Pendlay Row'};
            // Too many strings in the data
            data.map(function(item){
                item.date = parseInt(item.date);
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
            });

            data.sort(function(a,b) {
                if (b.date < a.date) { return -1; }
                if (b.date > a.date) { return 1; }
                return 0;
            });

            return data;
        };

        var handleUserData = function(data, userData) {
            userData.data = processData(data);
            userData.usedExercises = usedExercises(data);
            userData.workoutDates = userData.data.map(function(x){return new Date(x.date).setHours(0,0,0,0).valueOf();});
            userData.activeDate = new Date(userData.workoutDates[0]);
            userData.showChart = true;
        };

        var loadUserInto = function(userId, userData) {
            if (userData === undefined || userId === undefined) {
                userData = {data:[]}; // Return new
            }

            if (userId === userStatus.username && localStorageService.isSupported) {
                var data = localStorageService.get('mydata');
                if (data) {
                    $log.info('Loading your '+userId+'data from local storage');
                    handleUserData(data, userData);
                    // TODO: If we determine it is up to date, no need to load from server!
                }

            }

            $log.info('Loading user data form server for '+userId );
            $http.get('/userraw/' + userId).success(function(data) {
                handleUserData(data, userData);

                if (userId === userStatus.username && localStorageService.isSupported) {
                    $log.info('Saving data into local storage for '+userId );
                    localStorageService.set('mydata', data);
                }
            });
            return userData; // Will get filled async
        };

        var ret = {
            loadUser : function(userId, userData) {
                return loadUserInto(userId, userData);
            },
            setCurrentUserId: function(newUserId) {
                if (currentUser.userId !== newUserId) {
                    currentUser.userId = newUserId;
                    currentUser.data = [];
                    loadUserInto(newUserId, currentUser);
                }
            },
            reloadCurrentUser: function() {
                loadUserInto(currentUser.userId, currentUser);
            },
            getCurrentUser:function() {
                return currentUser;
            }
        };
        return ret;
    });
