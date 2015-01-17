'use strict';

angular.module('Gainstrack', [
  'ngRoute',
  'mobile-angular-ui',
  'ui.bootstrap',
  'Gainstrack.controllers.Main',
  'mojofit'
])

  .config(function($routeProvider) {
    $routeProvider.when('/plates', {templateUrl:'views/plates.html',  reloadOnSearch: false});
    $routeProvider.when('/', {templateUrl:'views/mobile/home.html',  reloadOnSearch: false});
  });

angular.module('Gainstrack.controllers.Main', [])

  .controller('MainController', function($scope){

  });
