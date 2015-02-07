'use strict';

angular.module('clientApp')
  .provider('angularticsGainstrack', function () {
    var myClass = [
      'MojoServer', '$log', 'ready',
      function (MojoServer, $log, ready) {

        this.init = function () {
          var analytics = {
            trackPage : function(path) {
              $log.info('User visited ' +  path);
            },
            trackEvent : function(action, properties) {
              $log.info('User performed ' +  action + ' in category ' + properties.category);
            }
          };
          ready(analytics);
        };
      }];
    return {
      $get: ['$injector', function ($injector) {
        return $injector.instantiate(myClass, {
          ready: this._ready || angular.noop
        });
      }],
      ready: function (fn) {
        this._ready = fn;
      }
    };
  })
  .config(['$analyticsProvider', 'angularticsGainstrackProvider', function ($analyticsProvider, angularticsGainstrackProvider) {
    angularticsGainstrackProvider.ready(function (analytics) {
      $analyticsProvider.registerPageTrack(function (path) {
        analytics.trackPage(path);
      });
      $analyticsProvider.registerEventTrack(function (action, properties) {
        analytics.trackEvent(action, properties);
      });
    });
  }]);
/*
  .run(['angularticsGainstrack', function (angularticsGainstrack) {
    angularticsGainstrack.init();
  }]);
*/
