'use strict';

angular.module('clientApp')
    .controller('LoginCtrl', function ($scope, $location, MojoServer) {
        $scope.reg = {};
        $scope.lgn = {};
        $scope.userStatus = MojoServer.getUserStatus();

        var onLogin = function(user) {
            if (user.isLoggedIn) {
                $location.path('/user/' + user.username);
            }
        };

        $scope.register = function() {
            $scope.registerStatus = MojoServer.register($scope.reg.email, $scope.reg.firstname, $scope.reg.lastname) ;

        };

        $scope.login = function() {
            $scope.loginStatus = MojoServer.login($scope.lgn.email, $scope.lgn.password, onLogin);
        };
    });

angular.module('clientApp')
    .controller('UserStatusController', function ($scope, MojoServer) {
        $scope.userStatus = MojoServer.getUserStatus();

        $scope.logout = function() {
            $scope.userStatus = MojoServer.logout();
        };
    });