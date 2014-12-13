'use strict';

var allDoneJsStep1 = false;
var allDoneJs = false;
var init = function() {
    var doneJs = 0;
    var asyncJs= [
        '//www.google.com/jsapi',
        'http://canvg.googlecode.com/svn/trunk/rgbcolor.js',
        'http://canvg.googlecode.com/svn/trunk/canvg.js'];

    var loadCB2 = function() {
        console.log('Really allDoneJs');
        allDoneJs = true;
        drawChart(); // Coupling to fix
    };

    var loadCB = function() {
        console.log('One more done');
        doneJs++;
        allDoneJsStep1 = (doneJs === asyncJs.length);
        if (allDoneJsStep1) {
            window.google.load('visualization', '1', {
                'packages': ['corechart'],
                'callback': loadCB2
            });
        }
    };

    for (var i=0; i<asyncJs.length;i++) {
        $.ajax({
            url: asyncJs[i],
            dataType: 'script',
            cache: true,
            success: loadCB
        });
    }

};
init();

//window.google.load('visualization', '1', {packages:['corechart']});

//window.google.setOnLoadCallback(function() {
//    angular.bootstrap(document.body, ['clientApp']);
//});

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
        'gm.datepickerMultiSelect'
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
        var ret = {
            getStatus: function() {
                $http.get('/getUserStatus').success(function(data) {
                    this.userStatus = data;

                });
            },
            login: function(email,pass) {
                $http.post('/login', {email:email, password:pass}).success(function(data) {
                    this.userStatus = data;
                });
            },
            register: function(email, firstname, lastname) {
                var msg = {email:email, firstname:firstname, lastname:lastname};
                $http.post('/register', msg).success(function(data) {
                    // What to do with data
                    window.alert(data);
                });
            },
            userStatus : {}
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


        var genRepMax = function (items, names) {
            var MAX_REP = 20;
            var repMaxByName = {};
            names.forEach(function(name) {
                var repMax = new Array(MAX_REP);
                for (var k=0;k<MAX_REP;k++) {repMax[k] ={kg:0,date:0};}
                repMaxByName[name] = repMax;
            });

            items.forEach(function(item){
                item.actions.forEach(function(action) {
                    if (repMaxByName[action.name]) {
                        var repMax = repMaxByName[action.name];
                        action.sets.forEach(function(aset){
                            var reps = aset.reps-1;
                            var kg = aset.weight; // FIXME: to kg
                            if (reps >= MAX_REP) {reps = MAX_REP-1;}
                            for (var i=0; i<=reps; i++) {
                                if (repMax[i].kg < kg) {
                                    repMax[i].kg = kg;
                                    repMax[i].date = item.date;
                                    repMax[i].reps = reps;
                                }
                            }
                        });
                    }
                });

            });
            return names.map(function(name) {
                return {name:name, repMax : repMaxByName[name]};
            });

        };

        var loadUserInto = function(userId, userData) {
            if (userData === undefined || userId === undefined) {
                userData = {data:[]}; // Return new
            }
            $http.get('/userraw/' + userId).success(function(data) {
                userData.data = processData(data);
                userData.usedExercises = usedExercises(data);
                userData.repMax = genRepMax(data, userData.usedExercises);
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