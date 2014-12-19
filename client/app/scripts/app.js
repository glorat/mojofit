'use strict';

/**
 * @ngdoc overview
 * @name clientApp
 * @description
 * # clientApp
 *
 * Main module of the application.
 */
angular
  .module('clientApp', [
    'ngCookies',
    'ngRoute',
    'ui.bootstrap',
        'gm.datepickerMultiSelect',
        'googlechart'
    ]);


angular.module('clientApp').config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/user/:userId', {
                templateUrl: 'views/user.html',
                controller: 'UserCtrl',
                controllerAs: 'user'
            })
            .when('/slic', {
                templateUrl: 'views/slic.html'
            })
            .when('/about', {
                templateUrl: 'views/about.html',
                controller: 'AboutCtrl'
            })
            .when('/login', {
                templateUrl: 'views/login.html',
                controller: 'LoginCtrl'
            })
            .when('/repMax', {
                templateUrl: 'views/rep-max-table.html',
                controller: 'RepMaxController'
            })
            .when('/repMaxHistory', {
                templateUrl: 'views/rep-max-history.html',
                controller: 'RepMaxHistoryController'
            })
            .otherwise({
                templateUrl: 'views/slic.html'
            });
    }]);

angular.module('clientApp')
    .controller('AboutCtrl', function ($scope) {
        $scope.hello = 'world';
    });

angular.module('clientApp')
    .factory('MojoServer', function ($http) {
        var userStatus = {isLoggedIn:''};
        var registerStatus = {message:'',level:'info'};
        var loginStatus = {message:'', level:'info'};
        var ret = {
            getUserStatus: function() {
                $http.get('/command/getUserStatus').success(function(data) {
                    userStatus.isLoggedIn = data.isLoggedIn;
                    userStatus.email = data.email;
                });
                return userStatus;
            },
            login: function(email,pass) {
                loginStatus.message = 'Logging in...';
                loginStatus.level = 'info';
                $http.post('/command/login', {email:email, password:pass})
                    .success(function(data) {
                        userStatus = data.userStatus;
                        loginStatus.message = data.message;
                        loginStatus.level = data.level;
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
                $http.post('/command/register', msg)
                    .success(function(data) {
                        registerStatus.message = data.message;
                        registerStatus.level = data.level;
                    })
                    .error(function(data, status) {
                        registerStatus.message = 'There was an error sending the registration request. Please try again later';
                        registerStatus.level = 'danger';
                    });
                return registerStatus;
            }

        };
        return ret;
    });

angular.module('clientApp')
    .factory('UserState', function ($http) {

        var currentUser = {userId:undefined, data:[]};

        /*jshint unused: vars */
        var usedExercises = function (data) {
            //var nameByUse = {};

            return ['Barbell Squat', 'Barbell Bench Press', 'Barbell Deadlift', 'Standing Barbell Shoulder Press (OHP)'];
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
    .filter('startFrom', function(){
       return function(input, start) {
           start = +start;
           return input.slice(start);
       };
    });
