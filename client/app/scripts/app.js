'use strict';

google.load('visualization', '1', {packages:['corechart']});

google.setOnLoadCallback(function() {
    angular.bootstrap(document.body, ['clientApp']);
});

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
    'ngRoute'
  ]);


angular.module('clientApp').config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/user/:userId', {
                templateUrl: 'views/user.html',
                controller: 'UserCtrl',
                controllerAs: 'user'
            }).
            when('/slic', {
                templateUrl: 'views/slic.html'
            }).
            otherwise({
                redirectTo: 'views/main.html',
                controller: 'MainCtrl'
            });
    }]);