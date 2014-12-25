'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('clientApp')
  .controller('MainController', function ($scope, MojoServer) {
    $scope.userStatus = MojoServer.getUserStatus();

  });
