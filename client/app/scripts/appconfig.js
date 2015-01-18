
angular.module('clientApp').config(['$routeProvider','$locationProvider',
  function($routeProvider, $locationProvider) {
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
      .when('/trackweight', {
        templateUrl: 'views/trackweight.html',
        controller: 'TrackWeightController'
      })
      .when('/plates', {
        templateUrl: 'views/plates.html'
      })
      .otherwise({
        templateUrl: 'views/main.html',
        controller: 'MainController'
      });
    // use the HTML5 History API
    $locationProvider.html5Mode(true);
  }]);
