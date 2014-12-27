'use strict';

angular.module('clientApp')
    .factory('MojoServer', function ($http) {
        var userStatus = {isLoggedIn:undefined, id:'', username:'', userPrefs:{unit:'kg'}};
        var registerStatus = {message:'',level:'info'};
        var loginStatus = {message:'', level:'info'};
        var workoutStatus = {level:'info', message:''};

        var handleStatus = function (data, cb) {
            if (data.userStatus) {
                userStatus.isLoggedIn = data.userStatus.isLoggedIn;
                userStatus.email = data.userStatus.email;
                userStatus.id = data.userStatus.id;
                userStatus.username = data.userStatus.username;
            }
            loginStatus.message = data.message;
            loginStatus.level = data.level;
            if (cb && data.userStatus) { // Learn some JS - check for fn?
                cb(userStatus);
            }
        };

        var refreshUserStatus = function() {
            $http.get('/auth/getUserStatus').success(function(data) {
                userStatus.isLoggedIn = data.isLoggedIn;
                userStatus.email = data.email;
                userStatus.id = data.id;
                userStatus.username =data.username;
                // FIXME: Above lines are duped a few lines down
            });
        };

        var ret = {
            getUserStatus: function() {
                if (userStatus.isLoggedIn === undefined) {
                    refreshUserStatus();
                }
                return userStatus;
            },
            getUserPrefs: function() {
                return userStatus.userPrefs;
            },
            refreshUserStatus: function() {
                refreshUserStatus();
                return userStatus;
            },
            getCachedUserStatus: function() {
                return userStatus;
            },
            login: function(email,pass, cb) {
                loginStatus.message = 'Logging in...';
                loginStatus.level = 'info';
                $http.post('/auth/login', {email:email, password:pass})
                    .success(function(data) {
                        handleStatus(data, cb);
                    })
                    .error(function() {
                        loginStatus.message = 'There was an error logging in. Please try again later';
                        loginStatus.level = 'danger';
                    });
                return loginStatus;
            },
            changepass: function(oldpass, newpass) {
                var action = 'changing password';
                var msg = {oldpass:oldpass, newpass:newpass};
                var method = 'changepass';
                var cb;

                loginStatus.message = action + '...';
                loginStatus.level = 'info';
                $http.post('/auth/' + method, msg)
                    .success(function(data) {
                        handleStatus(data, cb);
                    })
                    .error(function() {
                        loginStatus.message = 'There was an error '+action+'. Please try again later';
                        loginStatus.level = 'danger';
                    });
                return loginStatus;
            },
            logout: function(email,pass, cb) {
                loginStatus.message = 'Logging out...';
                loginStatus.level = 'info';
                $http.post('/auth/logout', {})
                    .success(function(data) {
                        handleStatus(data, cb);
                    })
                    .error(function() {
                        loginStatus.message = 'There was an error logging in. Please try again later';
                        loginStatus.level = 'danger';
                    });
                return loginStatus;
            },
            register: function(email, firstname, lastname) {
                registerStatus.message = 'Attempting registration...';
                registerStatus.level = 'info';
                var msg = {email:email, firstname:firstname, lastname:lastname};
                $http.post('/auth/register', msg)
                    .success(function(data) {
                        registerStatus.message = data.message;
                        registerStatus.level = data.level;
                    })
                    /*jshint unused: vars */
                    .error(function(data, status) {
                        registerStatus.message = 'There was an error sending the registration request. Please try again later';
                        registerStatus.level = 'danger';
                    });
                return registerStatus;
            },
            submitWorkout: function(items, cb) {
                workoutStatus.message = 'Submitting workout...';
                workoutStatus.level = 'info';
                var msg = {items:items};
                $http.post('/command/submitWorkouts', msg)
                    .success(function(data) {
                        workoutStatus.message = data.message;
                        workoutStatus.level = data.level;
                        if (cb && workoutStatus.level === 'success') { // Learn some JS - check for fn?
                            cb();
                        }
                    })
                    /*jshint unused: vars */
                    .error(function(data, status) {
                        workoutStatus.message = 'There was an error sending the registration request. Please try again later';
                        workoutStatus.level = 'danger';
                    });
                return workoutStatus;
            },
            deleteWorkout: function(date, cb) {
                workoutStatus.message = 'Deleting workout...';
                workoutStatus.level = 'info';
                $http.post('/command/deleteWorkout', {date : date})
                    .success(function(data) {
                        workoutStatus.message = data.message;
                        workoutStatus.level = data.level;
                        if (cb && workoutStatus.level === 'success') { // Learn some JS - check for fn?
                            cb();
                        }
                    })
                    /*jshint unused: vars */
                    .error(function(data, status) {
                        workoutStatus.message = 'There was an error deleting the workout. Please try again later';
                        workoutStatus.level = 'danger';
                    });
                return workoutStatus;
            }

        };
        return ret;
    });


angular.module('clientApp')
    .factory('UserState', function ($http, $log) {

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

        var loadUserInto = function(userId, userData) {
            if (userData === undefined || userId === undefined) {
                userData = {data:[]}; // Return new
            }
            $log.info('Loading user data form server for '+userId );
            $http.get('/userraw/' + userId).success(function(data) {
                userData.data = processData(data);
                userData.usedExercises = usedExercises(data);
                userData.workoutDates = userData.data.map(function(x){return new Date(x.date).setHours(0,0,0,0).valueOf();});
                userData.activeDate = new Date(userData.workoutDates[0]);
                userData.showChart = true;
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

angular.module('clientApp')
    .factory('WorkoutState', function () {
        var workout = {date:new Date().setHours(0,0,0,0).valueOf(), actions:[]};

        var ret = {
          getWorkout : function() {
            return workout;
          },
          setWorkout : function(newW) {
              workout.date = newW.date.valueOf();
              workout.actions = angular.copy(newW.actions);
          }
        };
        return ret;
    });

angular.module('clientApp')
    .factory('UnitConverter', function () {
        var data = {
            'kg' : [1,'kg'],
            'lb' : [1/2.2, 'kg']
        };

        var ret = {
            convert : function(from, fromUnit, toUnit) {
                if (fromUnit === toUnit) {
                    return from;
                }
                else if (data[fromUnit] && data[toUnit] && data[fromUnit][1]===data[toUnit][1]) {
                    return from * data[fromUnit][0] / data[toUnit][0];
                }
                else {
                    return 0;
                }
            }
        };
        return ret;
    });