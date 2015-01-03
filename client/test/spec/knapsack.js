'use strict';

describe('Service: KnapSack', function () {

    // load the controller's module
    beforeEach(module('clientApp'));

    var KnapSack;

    beforeEach(inject(function (_KnapSack) {
        KnapSack = _KnapSack_;
    }));

    it('should be loadable', function () {
        expect(KnapSack).isDefined();
    });
});
