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
        'googlechart',
        'LocalStorageModule',
        'viewhead',
        'mojofit'
    ]);


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

angular.module('clientApp').directive('selectOnClick', function () {
  return {
    restrict: 'A',
    /*jshint unused: vars */
    link: function (scope, element, attrs) {
      element.on('click', function () {
        this.select();
      });
    }
  };
});
