import clut from './clut';
describe('clut', () => {
    describe('index', () => {
        it('should have categories', () => {
            expect(clut.index).to.not.be.empty;
            expect(clut.index[0]).to.have.property('name').that.is.a('string');
            expect(clut.index[0]).to.have.property('cluts').that.is.not.empty;
        });
        it('should have cluts', () => {
            let c = clut.index[0].cluts[0];
            expect(c).to.have.property('name').that.is.a('string');
            expect(c).to.have.property('path').that.is.a('string');
        });
    });
    describe('get', () => {
        it('should return a promise for a clut', function (done) {
            let c = clut.index[0].cluts[0],
                promise = clut.get(c.path);
            promise.then(function (imageData) {
                expect(imageData.constructor).to.equal(window.ImageData);
                done();
            });
        });
        it('should cache the last clut', () => {
            let c = clut.index[0].cluts[0],
                promiseA = clut.get(c.path),
                promiseB = clut.get(c.path);
            expect(promiseA).to.equal(promiseB);
        });
        it('should not return the last clut if a different one is requested', () => {
            let cA = clut.index[0].cluts[0],
                cB = clut.index[0].cluts[1],
                promiseA = clut.get(cA.path),
                promiseB = clut.get(cB.path);
            expect(promiseA).not.to.equal(promiseB);
        });

    });

});
