'use strict';

angular.module('clientApp')
    .factory('UserStateLoader', function ($http, $log, $rootScope, localStorageService, MojoServer, RepMaxCalculator) {
        var defaultExercises = ['Barbell Squat', 'Standing Barbell Shoulder Press (OHP)', 'Barbell Bench Press', 'Barbell Deadlift', 'Pendlay Row', 'Power Clean', 'Pull-Up', 'Front Barbell Squat', 'Standing Dumbbell Shoulder Press', 'Barbell Curl', 'Cable External Rotation', 'Hang Clean', 'Clean and Jerk', 'Lat Pulldown', 'Hang Power Clean', 'Clean', 'Dips - Triceps Version', 'Face Pull', 'Dumbbell Bicep Curl', 'Plank', 'Goblet Squat (dumbbell)', 'Bent Over Barbell Row', 'Body Weight Glute Hamstring Raise', 'Front Squat', 'Power Snatch', 'Dumbbell Bulgarian Split Squat', 'Push-Up', 'Dumbbell Side Lateral Raise', 'Farmer\'s Walk', 'Abductor Machine', 'Overhead Barbell Squat', 'Bent-Over Rear Delt Raise', 'Front Dumbbell Raise', 'One-Arm Dumbbell Row', 'Barbell Shrug', 'Seated Bent-Over Rear Delt Raise', 'Seated Cable Row', 'Chin-Up', 'Snatch'];

        var userStatus = MojoServer.getUserStatus();

        var myCache = {}; // userId -> {state:String, data:Object}

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

        var attachRepMaxToItems = function(items, repMaxByName) {
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
                            if (!set.badges) {set.badges=[];}
                            set.badges.push(tag);
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
        };

        var copyUserInto = function(dataObj, userData) {
            var start = +new Date();
            var data = dataObj.items;
            userData.revision = +dataObj.revision;
            userData.data = processData(data);
            userData.usedExercises = usedExercises(data);
            userData.workoutDates = userData.data.map(function(x){return new Date(x.date).setHours(0,0,0,0).valueOf();});
            userData.activeDate = new Date(userData.workoutDates[0]);
            userData.showChart = true;
            userData.repMax = RepMaxCalculator.genRepMaxFull(userData.data, userData.usedExercises, 'kg');
            attachRepMaxToItems(userData.data, userData.repMax);
            var diff = new Date() - start;
            $log.info('Processed user state in ' + diff +'ms');
        };

        var loadUser = function(userId) {
            var userData = {userId:userId}; // Brand new. TODO:Get from memcache

            if (localStorageService.isSupported) {
                var data = localStorageService.get('mydata');
                // Lots of fields to force regen as I upgraded schemas
                if (data && data.items && data.userId === userId) {
                    $log.info('Loading your '+userId+' data from local storage');
                    copyUserInto(data, userData);
                    $rootScope.$broadcast('UserState:stateLoaded',userData);
                    // If we determine it is up to date, no need to load from server!
                    if (userStatus.username === userId && userStatus.revision > data.revision) {
                        $log.info('but will async update from server');

                    }
                    else {
                        $log.debug('Assume we do not need server refresh yet');
                        return;
                    }
                }
            }


            reallyGoGet(userId, function(data) {
                copyUserInto(data, userData);
                $rootScope.$broadcast('UserState:stateLoaded',userData);
            });
        };

        var reallyGoGet = function(userId, getCb) {
            $log.info('Loading user data from server for '+userId );
            if (!myCache.hasOwnProperty(userId)) {
                myCache[userId] = {};
            }
            if (myCache[userId].state === 'requesting') {
                $log.info('Dropping duplicate get request for ' + userId);
                return;
            }

            myCache[userId].state = 'requesting';
            $http.get('/userraw/' + userId).success(function(data) {
                // Due to aliasing, server may have stored userId
                // and we don't want to gen it at runtime server currently
                data.userId = userId;
                if (userId === userStatus.username && localStorageService.isSupported) {
                    $log.info('Saving data into local storage for '+userId );
                    localStorageService.set('mydata', data);
                }

                myCache[userId].state = 'done';
                myCache[userId].data = data;
                getCb(data);
            });
        };

        return {
            loadUser: loadUser,
            //loadUserInto : loadUserInto,
            //copyUserInto: copyUserInto,
            defaultExercises: defaultExercises
        };
    });

angular.module('clientApp')
    .factory('UserState', function ($http, $log, $rootScope, MojoServer, localStorageService, UserStateLoader) {

        var defaultUser = function(userId) {
            return {userId:userId, data:[], usedExercises:UserStateLoader.defaultExercises, revision:0, repMax:{}};
        };

        var currentUser = defaultUser(undefined);

        var myUser = defaultUser(undefined);

        var cloneInto = function(srcUser, tgtUser) {
            tgtUser.userId = srcUser.userId;
            tgtUser.revision = srcUser.revision;
            tgtUser.data = srcUser.data;
            tgtUser.usedExercises = srcUser.usedExercises;
            tgtUser.workoutDates = srcUser.workoutDates;
            tgtUser.activeDate = srcUser.activeDate;
            tgtUser.showChart = srcUser.showChart;
            tgtUser.repMax = srcUser.repMax;
        };

        // Listen for userId changes so we can manage just ourself
        /*jshint unused: vars */
        $rootScope.$on('MojoServer:userStatus', function(event,data) {
            //userStatus === data; // Require
            $log.info('UserState detected change in userStatus - Preloading state ' + data.username + ':' + data.revision);
            var userId = data.username;
            cloneInto(defaultUser(userId), myUser);
            UserStateLoader.loadUser(userId);

        });

        $rootScope.$on('UserState:stateLoaded', function(event, data){
            var userId = data.userId;
            if (userId === currentUser.userId) {
                $log.info('UserState received new state for currentUser ' + currentUser.userId);
                cloneInto(data, currentUser);
            }

            if (userId === myUser.userId) {
                $log.info('UserState received new state for myUser ' + myUser.userId);
                cloneInto(data, myUser);
            }
        });


        var ret = {
            setCurrentUserId: function(newUserId) {
                if (currentUser.userId !== newUserId) {
                    cloneInto(defaultUser(newUserId), currentUser);
                    UserStateLoader.loadUser(newUserId);
                }
            },
            reloadCurrentUser: function() {
                UserStateLoader.loadUser(currentUser.userId);
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
