'use strict';

angular.module('Gainstrack', [
  'ngRoute',
  'mobile-angular-ui',
  'ui.bootstrap',
  'Gainstrack.controllers.Main',
  'mojofit',
  'clientApp'
])

  .config(function($routeProvider) {
    $routeProvider.when('/plates', {templateUrl:'views/plates.html',  reloadOnSearch: false});
    $routeProvider.when('/', {templateUrl:'views/mobile/home.html',  reloadOnSearch: false});
    $routeProvider.when('/login', {templateUrl:'views/login.html', reloadOnSearch: false});
    $routeProvider.when('/track', {
      templateUrl: 'views/track.html',
      controller: 'TrackController',
      reloadOnSearch: false
    });
    $routeProvider.when('/user/:userId', {
      templateUrl: 'views/mobile/mobileuser.html',
      controller: 'MobileUserController',
      controllerAs: 'user',
      reloadOnSearch: false
    })
    .when('/repMax', {
      templateUrl: 'views/mobile/rep-max-table.html',
      controller: 'RepMaxController',
      reloadOnSearch: false
    })
    .when('/score', {
      templateUrl: 'views/score.html',
      controller: 'ScoreController',
      reloadOnSearch: false
    });

  });

angular.module('Gainstrack.controllers.Main', [])

  .controller('MainController', function($scope){
    $scope.foo = 'bar';
  });
