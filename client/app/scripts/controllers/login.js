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

        this.register = function() {
            $scope.registerStatus = MojoServer.register($scope.reg.email, $scope.reg.firstname, $scope.reg.lastname) ;

        };

        this.login = function() {
            $scope.loginStatus = MojoServer.login($scope.lgn.email, $scope.lgn.password, onLogin);
        };

        this.changepass = function() {
            $scope.loginStatus = MojoServer.changepass($scope.cp.oldpass, $scope.cp.newpass);
        };

      this.logout = function() {
        if (window.confirm('Are you sure you wish to disconnect from your account?')) {
          $scope.loginStatus =  MojoServer.logout();
          location.reload();
        };
      }
    });

angular.module('clientApp')
    .controller('UserStatusController', function ($scope, MojoServer) {
        $scope.userStatus = MojoServer.getUserStatus();

        $scope.logout = function() {
            $scope.userStatus = MojoServer.logout();
        };
    });
