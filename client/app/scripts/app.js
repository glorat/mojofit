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
            .otherwise({
                templateUrl: 'views/slic.html'
            });
    }]);

angular.module('clientApp')
    .controller('AboutCtrl', function ($scope) {
        $scope.hello = 'world';
    });

angular.module('clientApp')
    .service('MojoServer', function ($http, $scope) {
        var getStatus = function() {
            $http.get('/getUserStatus').success(function(data) {
                $scope.userStatus = data;

            });
        };
        var login = function(email,pass) {
            $http.post('/login', {email:email, pass:pass}).success(function(data) {
                $scope.userStatus = data;
            });
        };

        var register = function(email, firstname, lastname) {
            var msg = {email:email, firstname:firstname, lastname:lastname};
            $http.post('/register', msg).success(function(data) {
               // What to do with data
            });
        };


    });
