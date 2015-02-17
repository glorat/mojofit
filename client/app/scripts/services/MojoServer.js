'use strict';

angular.module('clientApp')
    .factory('MojoServer', function ($http, $rootScope, $log) {
    var urlPrefix = ''; // http://www.gainstrack.com
        var userStatus = {isLoggedIn:undefined, id:'', username:''};
        var registerStatus = {message:'',level:'info'};
        var loginStatus = {message:'', level:'info'};
        var workoutStatus = {level:'info', message:''};

        var userStatusReqStatus; // enums? FSM
    var csrfToken = '';


    var app = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
    if ( app ) {
      // PhoneGap application
      urlPrefix = 'http://www.gainstrack.com';
    } else {
      // Web page
    }

        var handleStatus = function (data, cb, status) {
          if (!status) {
            status = loginStatus;
          }
          if (data.csrfToken) {
            csrfToken = data.csrfToken;
          }

            if (data.userStatus) {
                userStatus.isLoggedIn = data.userStatus.isLoggedIn;
                userStatus.email = data.userStatus.email;
                userStatus.id = data.userStatus.id;
                userStatus.username = data.userStatus.username;
                userStatus.revision = data.userStatus.revision;
            }
          status.message = data.message;
          status.level = data.level;

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
          var req = {
            method: 'POST',
            url: urlPrefix + url,
            headers: {
              'X-XSRF-TOKEN': csrfToken
            },
            data: msg
          };

          return $http(req);
        };

    var genSubmit = function(action, status, cmd, msg, cb) {
      status.message = action + '...';
      status.level = 'info';
      doPost('/command/' + cmd, msg)
        .success(function(data) {
          status.message = data.message;
          status.level = data.level;
          if (cb && status.level === 'success') { // Learn some JS - check for fn?
            cb();
          }
        })
        /*jshint unused: vars */
        .error(function(data, status) {
          status.message = 'There was an error '+action+'. Please try again later';
          status.level = 'danger';
        });
      return status;
    };

        var ret = {
            getUserStatus: function() {
                if (userStatus.isLoggedIn === undefined && userStatusReqStatus !== 'requesting') {
                    refreshUserStatus();
                }
                return userStatus;
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
              var action = 'logging out';
                loginStatus.message = action + '...';
                loginStatus.level = 'info';
                doPost('/auth/logout', {a:'b'})
                    .success(function(data) {
                        handleStatus(data, cb);
                    })
                    .error(function() {
                        loginStatus.message = 'There was an error '+action+'. Please try again later';
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
              var msg = {date:date, body:weight};
              return genSubmit('submitting weight record', workoutStatus, 'submitWeight', msg, cb);
            },
            submitPrefs: function(origprefs, cb) {
              var prefs = angular.copy(origprefs);
              if (prefs.dob) {
                var d = prefs.dob;
                prefs.dob = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
              }
              return genSubmit('submitting preferences', workoutStatus, 'submitPrefs', prefs, cb);
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
