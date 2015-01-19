'use strict';

angular.module('clientApp')
    .factory('MojoServer', function ($http, $rootScope, $log) {
    var urlPrefix = ''; // http://www.gainstrack.com
        var userStatus = {isLoggedIn:undefined, id:'', username:'', userPrefs:{unit:'kg'}};
        var registerStatus = {message:'',level:'info'};
        var loginStatus = {message:'', level:'info'};
        var workoutStatus = {level:'info', message:''};

        var userStatusReqStatus; // enums? FSM

        var handleStatus = function (data, cb) {
            if (data.userStatus) {
                userStatus.isLoggedIn = data.userStatus.isLoggedIn;
                userStatus.email = data.userStatus.email;
                userStatus.id = data.userStatus.id;
                userStatus.username = data.userStatus.username;
                userStatus.revision = data.userStatus.revision;
            }
            loginStatus.message = data.message;
            loginStatus.level = data.level;

            userStatusReqStatus = 'done';

            $rootScope.$broadcast('MojoServer:userStatus',userStatus);

            if (cb && data.userStatus) { // Learn some JS - check for fn?
                cb(userStatus);
            }
        };

        var refreshUserStatus = function() {
            userStatusReqStatus = 'requesting';
            doPost('/auth/getUserStatus').success(function(data) {
                handleStatus(data);
            });
        };

        var doPost = function(url, msg) {
          return $http.post(urlPrefix + url, msg);
        };

        var ret = {
            getUserStatus: function() {
                if (userStatus.isLoggedIn === undefined && userStatusReqStatus !== 'requesting') {
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
                doPost('/auth/login', {email:email, password:pass})
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
                doPost('/auth/' + method, msg)
                    .success(function(data) {
                        handleStatus(data, cb);
                    })
                    .error(function() {
                        loginStatus.message = 'There was an error '+action+'. Please try again later';
                        loginStatus.level = 'danger';
                    });
                return loginStatus;
            },
            logout: function(cb) {
                loginStatus.message = 'Logging out...';
                loginStatus.level = 'info';
                doPost('/auth/logout', {})
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
                doPost('/auth/register', msg)
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
                doPost('/command/submitWorkouts', msg)
                    .success(function(data) {
                        workoutStatus.message = data.message;
                        workoutStatus.level = data.level;
                        if (cb && workoutStatus.level === 'success') { // Learn some JS - check for fn?
                            cb();
                        }
                    })
                    /*jshint unused: vars */
                    .error(function(data, status) {
                        workoutStatus.message = 'There was an error submitting the workout. Please try again later';
                        workoutStatus.level = 'danger';
                    });
                return workoutStatus;
            },
            submitWeight: function(date, weight, cb) {
                workoutStatus.message = 'Submitting weight record...';
                workoutStatus.level = 'info';
                var msg = {date:date, body:weight};
                doPost('/command/submitWeight', msg)
                    .success(function(data) {
                        workoutStatus.message = data.message;
                        workoutStatus.level = data.level;
                        if (cb && workoutStatus.level === 'success') { // Learn some JS - check for fn?
                            cb();
                        }
                    })
                    /*jshint unused: vars */
                    .error(function(data, status) {
                        workoutStatus.message = 'There was an error submitting the request. Please try again later';
                        workoutStatus.level = 'danger';
                    });
                return workoutStatus;
            },
            deleteWorkout: function(date, cb) {
                workoutStatus.message = 'Deleting workout...';
                workoutStatus.level = 'info';
                doPost('/command/deleteWorkout', {date : date})
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
            },
          getUserRaw : function(userId) {
            return $http.get(urlPrefix + '/userraw/' + userId);
          },
          setUrlPrefix : function(newPrefix) {
            $log.warn('Setting $http prefix, presumably from Cordova');
            urlPrefix = newPrefix;
          }

        };
        return ret;
    });
