'use strict';

angular.module('Gainstrack', [
  'ngRoute',
  'mobile-angular-ui',
  'ui.bootstrap',
  'Gainstrack.controllers.Main',
  'mojofit',
  'clientApp',
  'Firestitch.angular-counter'
])

  .config(function($routeProvider) {
    $routeProvider.when('/plates', {templateUrl:'views/plates.html',  reloadOnSearch: false});
    $routeProvider.when('/', {templateUrl:'views/mobile/home.html',  reloadOnSearch: false});
    $routeProvider.when('/login', {templateUrl:'views/login.html', reloadOnSearch: false});
    $routeProvider.when('/track', {
      templateUrl: 'views/track.html',
      controller: 'TrackController',
      reloadOnSearch: false
    })
      .when('/plan', {
        templateUrl: 'views/plan.html',
        controller: 'PlanController',
        reloadOnSearch: false
      })
      .when('/trackweight', {
        templateUrl: 'views/trackweight.html',
        controller: 'TrackWeightController',
        reloadOnSearch: false
      })
      .when('/user/:userId', {
        templateUrl: 'views/mobile/mobileuser.html',
        controller: 'MobileUserController',
        controllerAs: 'user',
        reloadOnSearch: false
      })
      .when('/user/:userId/:workoutDate', {
        templateUrl: 'views/workoutReport.html'
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
    })
      .when('/news', {
        template: '<iframe src="http://blog.gainstrack.com" height="100%" width="100%"></iframe>',
        reloadOnSearch: false
      })
      .when('/gymbuddy', {
        templateUrl: 'views/mobile/gymbuddy.html',
        reloadOnSearch: false
      });

  })
  .run(['angularticsGainstrack', function (angularticsGainstrack) {
    angularticsGainstrack.init();
  }]);


angular.module('Gainstrack.controllers.Main', [])

  .controller('MainController', function($scope){
    $scope.foo = 'bar';
  });
