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
            .when('/track', {
                templateUrl: 'views/track.html',
                controller: 'TrackController'
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
    .filter('startFrom', function(){
       return function(input, start) {
           start = +start;
           return input.slice(start);
       };
    });



angular.module('clientApp')
    .directive('enterTab', function(){
      return {
        restrict: 'A',
          link: function($scope,elem) {
              elem.bind('keydown', function(e) {
                 var code = e.keyCode || e.which;
                  if (code === 13) {
                      e.preventDefault();
                      elem.nextAll('input').focus();
                  }
              });
          }
      };
    });
