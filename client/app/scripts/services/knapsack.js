
// Here we have 4 pairs
var demo = [[45,1],[10,2],[1,1]];

var demo2 = [[20,6],[15,6],[10,6],[5,6],[2.5,6],[1,1.25]];

var enumerate2 = function(plates) {
    var ps = [[]];
    var weights=[0];
    var scores=[0];
    var byWeight = {};
    for (var i = 0, ilen = plates.length; i < ilen; i++) {
        for (var j = 0, len = ps.length; j < len; j++) {
            for (var p= 1, plen=plates[i][1]; p<=plen; p++) {
                var plate = plates[i];
                var stack = ps[j].concat( [plate[0],p] );
                ps.push(stack);
                var weight = weights[j] + plate[0]*p;
                weights.push(weight);
                var score = scores[j] + plate[0]*p*plate[0]*p;
                scores.push(score);
                if (byWeight[weight] && byWeight[weight].score > score) {
                    // Do nothing
                }
                else {
                    byWeight[weight] = {score:score, plates:stack};
                }
            }
        }
    }
    return byWeight;
};


var calcWeight = function(plates) {
    var s = 0;
    for (var i = 0, ilen = plates.length; i < ilen; i+=2) {
        s += plates[i]*plates[i+1];
    }
    return s;
};
