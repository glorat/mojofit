'use strict';

angular.module('clientApp').directive('userPrefs', function () {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'views/user-prefs.html',
        controller: function ($scope, MojoServer) {
            $scope.userPrefs = MojoServer.getUserStatus().userPrefs;
        }
    };
});