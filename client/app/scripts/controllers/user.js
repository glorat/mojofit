'use strict';

// Use these two for global callbacks to make the graph work
var jsonData;
function drawChart() {
    var data = new google.visualization.DataTable(jsonData);
    var options = {'hAxis':{'title':''},'vAxis':{'title':'','format':'# kg'},'width':900,'height':500,'interpolateNulls':'true','legend':{'position':'top','maxLines':5}};
    var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    chart.draw(data, options);
}

/**
 * @ngdoc function
 * @name clientApp.controller:UserCtrl
 * @description
 * # UserCtrl
 * Controller of the clientApp
 */
angular.module('clientApp')
  .controller('UserCtrl', function ($scope, $http, $routeParams) {
        $scope.userId = $routeParams.userId;

        console.log('UserCtrl userId ' + $scope.userId);

        var userstream = this;
        userstream.data = [];
        $http.get('/userraw/'+$scope.userId+'.json').success(function(data) {
            userstream.data = data;
        });

        $scope.datestr = function(ts) {
            return new Date(ts*1000).toDateString();
        };

        $.ajax({
            url: '/userjson/' + $scope.userId,
            dataType:'script',
            async: true,
            success: function(data, text, foo) {
                drawChart();
            }
        });

    });


angular.module('clientApp').directive('setText', function () {
    return {
        restrict: 'E',
        scope: {data : '=', unit:'@'},
        controller: function ($scope) {
            $scope.storedUnit = function() {
                if ( $scope.data.lbs) {return 'lbs';}
                else {return 'kg';}
            };
            $scope.value = function() {
                var myUnit = $scope.storedUnit();
                return $scope.data[myUnit];
            };
        },
        template: '{{ data.reps }} x {{ value() }} {{ storedUnit() }}'
    };
});