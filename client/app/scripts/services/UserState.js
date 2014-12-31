'use strict';

angular.module('clientApp')
    .factory('UserStateLoader', function ($http, $log, $rootScope, MojoServer, localStorageService) {
        var defaultExercises = ['Barbell Squat', 'Standing Barbell Shoulder Press (OHP)', 'Barbell Bench Press', 'Barbell Deadlift', 'Pendlay Row', 'Power Clean', 'Pull-Up', 'Front Barbell Squat', 'Standing Dumbbell Shoulder Press', 'Barbell Curl', 'Cable External Rotation', 'Hang Clean', 'Clean and Jerk', 'Lat Pulldown', 'Hang Power Clean', 'Clean', 'Dips - Triceps Version', 'Face Pull', 'Dumbbell Bicep Curl', 'Plank', 'Goblet Squat (dumbbell)', 'Bent Over Barbell Row', 'Body Weight Glute Hamstring Raise', 'Front Squat', 'Power Snatch', 'Dumbbell Bulgarian Split Squat', 'Push-Up', 'Dumbbell Side Lateral Raise', 'Farmer\'s Walk', 'Abductor Machine', 'Overhead Barbell Squat', 'Bent-Over Rear Delt Raise', 'Front Dumbbell Raise', 'One-Arm Dumbbell Row', 'Barbell Shrug', 'Seated Bent-Over Rear Delt Raise', 'Seated Cable Row', 'Chin-Up', 'Snatch'];

        var userStatus = MojoServer.getUserStatus();

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

        var handleUserData = function(dataObj, userData) {
            var data = dataObj.items;
            userData.revision = +dataObj.revision;
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

            if (localStorageService.isSupported) {
                var data = localStorageService.get('mydata');
                if (data && data.items && data.userId === userId) {
                    $log.info('Loading your '+userId+'data from local storage');
                    handleUserData(data, userData);
                    // If we determine it is up to date, no need to load from server!
                    if (userStatus.username === userId && userStatus.revision > data.revision) {
                        $log.info('but will async update from server');

                    }
                    else {
                        $log.debug('Assume we do not need server refresh yet');
                        return userData;
                    }
                }
            }

            $log.info('Loading user data from server for '+userId );
            $http.get('/userraw/' + userId).success(function(data) {
                // Due to aliasing, server may have stored userId
                // and we don't want to gen it at runtime server currently
                data.userId = userId;
                handleUserData(data, userData);

                if (userId === userStatus.username && localStorageService.isSupported) {
                    $log.info('Saving data into local storage for '+userId );
                    localStorageService.set('mydata', data);
                }
            });
            return userData; // Will get filled async
        };

        return {
            loadUserInto : loadUserInto,
            defaultExercises: defaultExercises
        };
    });

angular.module('clientApp')
    .factory('UserState', function ($http, $log, $rootScope, MojoServer, localStorageService, UserStateLoader) {

        var currentUser = {userId:undefined, data:[], usedExercises:UserStateLoader.defaultExercises, revision:0};

        var myUser = {userId:undefined, data:[], usedExercises:UserStateLoader.defaultExercises, revision:0};

        // Listen for userId changes so we can manage just ourself
        /*jshint unused: vars */
        $rootScope.$on('MojoServer:userStatus', function(event,data) {
            //userStatus === data; // Require
            $log.info('UserState detected change in userStatus - Preloading state');
            var userId = data.username;
            UserStateLoader.loadUserInto(userId, myUser);

            if (currentUser.userId === userId) {
                // FIXME: Need a proper cache inside UserStateLoader
                $log.info('Dual loading state for currentUser');
                UserStateLoader.loadUserInto(userId, currentUser);
            }
        });


        var ret = {
            loadUser : function(userId, userData) {
                $log.warn('UserState.loadUser deprecated');
                return UserStateLoader.loadUserInto(userId, userData);
            },
            setCurrentUserId: function(newUserId) {
                if (currentUser.userId !== newUserId) {
                    currentUser.userId = newUserId;
                    currentUser.data = [];
                    UserStateLoader.loadUserInto(newUserId, currentUser);
                }
            },
            reloadCurrentUser: function() {
                UserStateLoader.loadUserInto(currentUser.userId, currentUser);
            },
            getCurrentUser:function() {
                return currentUser;
            },
            getMyState: function() {
                return myUser;
            },
            reloadMyState: function() {
                // Get latest revision number, to trigger new state load
                MojoServer.refreshUserStatus();
            }
        };
        return ret;
    });
