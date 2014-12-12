'use strict';

angular.module('clientApp')
    .controller('LoginCtrl', function ($scope, MojoServer) {
        $scope.reg = {};
        $scope.lgn = {};

        $scope.register = function() {
            MojoServer.register($scope.reg.email, $scope.reg.firstname, $scope.reg.lastname) ;
        };

        $scope.login = function() {
            MojoServer.login($scope.lgn.email, $scope.lgn.password);
        };
    });