import CanvasProcessor from './canvas-processor';
import sinon from 'sinon';

describe('canvas processor', () => {
    let canvas = document.createElement('canvas');
    it('should be instanciable', () => {
        new CanvasProcessor(canvas);
    });

    describe('process', () => {
        let processor,
            image;
        beforeEach(done => {
            processor = new CanvasProcessor(canvas);
            image = new Image();
            image.src = '/public/samples/cup.jpg';
            image.onload = () => done();
        });
        it('should process an image', () => {
            let promise = processor.process(image, {});
            expect(promise).to.be.fulfilled;
        });
        describe('options', () => {
            describe('clut', () => {
                it('should not change the colors using the identity clut', () => {
                });
            });
        });
    });
});
