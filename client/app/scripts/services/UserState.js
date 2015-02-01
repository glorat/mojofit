'use strict';

angular.module('clientApp')
    .factory('UserStateLoader', function ($log, $rootScope, localStorageService, MojoServer, RepMaxCalculator, fitViewProcessor) {

        var userStatus = MojoServer.getUserStatus();

        var myCache = {}; // userId -> {state:String, data:Object}
        // var fv = foo(RepMaxCalculator);
        var fv = fitViewProcessor;
        var defaultExercises = fv.defaultExercises;

        var copyUserInto = function(dataObj, userData) {
            var start = +new Date();
            fv.copyUserInto(dataObj,userData);
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
            MojoServer.getUserRaw(userId).success(function(data) {
                // Due to aliasing, server may have stored userId
                // and we don't want to gen it at runtime server currently
                data.userId = userId;
                if (userId === userStatus.username && localStorageService.isSupported) {
                    $log.info('Saving data into local storage for '+userId );
                    localStorageService.set('mydata', data);
                }
                $log.info('Done user state request for ' + userId);
                myCache[userId].state = 'done';
                myCache[userId].data = data;
                getCb(data);
            }).error(function(){
              $log.warn('Failed user state request for ' + userId);
              myCache[userId].state = 'error';
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
    .factory('UserState', function ($log, $rootScope, MojoServer, localStorageService, UserStateLoader) {

        var defaultUser = function(userId) {
          /*jshint camelcase: false */
            return {
              userId:userId,
              data:[],
              usedExercises:UserStateLoader.defaultExercises,
              revision:0,
              stats:{repMax:{}},
              setBadges:{},
              prefs:{}
            };
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
            tgtUser.stats = srcUser.stats;
            tgtUser.setBadges = srcUser.setBadges;
            tgtUser.prefs = srcUser.prefs;
        };

    var onUserStatusUpdate = function(event,data) {
      //userStatus === data; // Require
      $log.info('UserState detected change in userStatus - Preloading state ' + data.username + ':' + data.revision);
      var userId = data.username;
      if (userId) {
        cloneInto(defaultUser(userId), myUser);
        UserStateLoader.loadUser(userId);
      }
    };

    // Listen for userId changes so we can manage just ourself

        $rootScope.$on('MojoServer:userStatus', onUserStatusUpdate);

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

    var userStatus = MojoServer.getUserStatus();
    onUserStatusUpdate(null, userStatus);

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
            },
           clearCache:function() {
             $log.info('Clearing localCache of myData');
             localStorageService.set('mydata', {});
           }
        };
        return ret;
    });
