'use strict';

describe('Controller: Strength Score', function () {
  var $compile,
    UserState,
    $controller;

  beforeEach(module('clientApp'));
  beforeEach(module('clientAppTemplates'));

  // Setup the mock service in an anonymous module.
  beforeEach(module(function ($provide) {
    $provide.factory('MojoServer', function(TestData) {
      var getUserStatus = function () {
        return TestData.status.userStatus;
      };
      return {
        getUserStatus: getUserStatus
      };
    });
    $provide.factory('UserStateLoader', function(TestData) {
      var loadUser = function() {return TestData.data;}
      return {
        loadUser : loadUser
      }
    })
  }));

  // Capture references to dependencies
  // so they are available to all tests in this describe block
  beforeEach(inject(function(_$compile_, _UserState_, _$controller_){
    // The injector unwraps the underscores (_) from around the parameter names when matching
    $compile = _$compile_;
    UserState = _UserState_;
    $controller = _$controller_;
  }));

  it('can know if the user can be edited', function() {
    //UserState.
    var scope = {user : UserState.getMyState(), $watch: angular.noop};

    var controller = $controller('strengthScoreController', { $scope: scope });
    var canEdit = scope.canEdit();
    expect(canEdit).toBe(true);
  });
});
