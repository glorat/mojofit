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
    $routeProvider.when('/track', {
      templateUrl: 'views/track.html',
      controller: 'TrackController',  reloadOnSearch: false
    });

    var app = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
    if ( app ) {
      // PhoneGap application
      //MojoServer.setUrlPrefix ('http://www.gainstrack.com');
    } else {
      // Web page
    }


  });

angular.module('Gainstrack.controllers.Main', [])

  .controller('MainController', function($scope){
    $scope.foo = 'bar';
  });
