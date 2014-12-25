'use strict';

angular.module('clientApp')
    .factory('MojoServer', function ($http) {
        var userStatus = {isLoggedIn:'', id:'', username:''};
        var registerStatus = {message:'',level:'info'};
        var loginStatus = {message:'', level:'info'};
        var workoutStatus = {level:'info', message:''};

        function handleStatus(data, cb) {
            userStatus.isLoggedIn = data.userStatus.isLoggedIn;
            userStatus.email = data.userStatus.email;
            userStatus.id = data.userStatus.id;
            userStatus.username = data.userStatus.username;
            loginStatus.message = data.message;
            loginStatus.level = data.level;
            if (cb) { // Learn some JS - check for fn?
                cb(userStatus);
            }
        }

        var ret = {
            getUserStatus: function() {
                $http.get('/auth/getUserStatus').success(function(data) {
                    userStatus.isLoggedIn = data.isLoggedIn;
                    userStatus.email = data.email;
                    userStatus.id = data.id;
                    userStatus.username =data.username;
                    // FIXME: Above lines are duped a few lines down
                });
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

        var defaultExercises =  ['Barbell Squat', 'Barbell Bench Press', 'Barbell Deadlift', 'Standing Barbell Shoulder Press (OHP)'];

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
            return x;
        };

        var processData = function (data) {
            // And do some name mappings
            var aliases = {'Bench Press':'Barbell Bench Press'};
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