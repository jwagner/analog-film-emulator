import medianFilter from './median-filter';

describe('medianFilter', () => {
    it('works for the base case', () => {
        var a = [2,3,1],
            b = [0,0,0];
        medianFilter(a, b, 0, 1, a.length);
        expect(b).to.eql([2,2,1]);
    });
    it('works when all the numbers are equal', () => {
        var a = [3,3,3],
            b = [0,0,0];
        medianFilter(a, b, 0, 1, a.length);
        expect(b).to.eql([3,3,3]);
    });
    it('works for a larger case', () => {
        var a = [0,1,4,2,8,3,1],
            b = [];
        medianFilter(a, b, 0, 1, a.length);
        expect(b).to.eql([0, 1, 2, 4, 3, 3, 1]);
    });
    it('works iteratively', () => {
        var a = [0,1,4,2,8,3,1],
            b = [];
        medianFilter(a, b, 0, 1, a.length);
        medianFilter(b, a, 0, 1, a.length);
        expect(a).to.eql([0, 1, 2, 3, 3, 3, 1]);

    });

});
