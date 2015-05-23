'use strict';

angular.module('clientApp').config(['$routeProvider','$locationProvider',
  function($routeProvider, $locationProvider) {
    $routeProvider.
      when('/user/:userId', {
        templateUrl: 'views/user.html',
        controller: 'UserCtrl',
        controllerAs: 'user'
      })
      .when('/user', {
        templateUrl: 'views/user.html',
        controller: 'UserCtrl',
        controllerAs: 'user'
      })
      .when('/user/:userId/:workoutDate', {
        templateUrl: 'views/workoutReport.html'
      })
      .when('/slic', {
        templateUrl: 'views/slic.html'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .when('/login', {
        templateUrl: 'views/login.html'
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
      .when('/plan', {
        templateUrl: 'views/plan.html',
        controller: 'PlanController'
      })
      .when('/trackweight', {
        templateUrl: 'views/trackweight.html',
        controller: 'TrackWeightController'
      })
      .when('/plates', {
        templateUrl: 'views/plates.html'
      })
      .when('/planner', {
        templateUrl: 'views/planner-index.html',
        controller:'PlannerIndexController'
      })
      .when('/planner/:program', {
        templateUrl: 'views/planner.html',
        controller:'PlannerController'
      })
      .otherwise({
        templateUrl: 'views/main.html',
        controller: 'MainController'
      });
    // use the HTML5 History API
    $locationProvider.html5Mode(true);
  }])
  .run(['angularticsGainstrack', function (angularticsGainstrack) {
    angularticsGainstrack.init();
  }]);
