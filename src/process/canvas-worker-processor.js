import _ from 'underscore';
import Promise from 'bluebird';
import WorkerPool from '../worker-pool';
import CanvasProcessor from './canvas-processor';
export default class CanvasWorkerProcessor extends CanvasProcessor {
    constructor(canvas){
        super(canvas);
        this.workers = new WorkerPool('worker.js');
    }
    static isSupported(){
        return !!document.createElement('canvas').getContext && window.Worker && !navigator.userAgent.match('MSIE 10');
    }
    static supportedOptions(){
        return ['clut', 'brightness'];
    }
    process(image, options, progress=function(){}){
        console.log('processing', options);
        let canvas = this.canvas,
            ctx = this.ctx,
            data;

        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;

        ctx.drawImage(image, 0, 0);

        //data = ctx.getImageData(0, 0, canvas.width, canvas.height);

        let n = this.workers.pool.length,
            chunk = Math.ceil(canvas.height/n),
            messages = [];

        for(var i = 0; i < n; i++) {
            let offset = chunk*i;
            let imageData = ctx.getImageData(0, offset,
                                             canvas.width, chunk),
                slice = {
                    width: canvas.width,
                    height: canvas.height,
                    x: 0,
                    y: offset
                };
            messages.push([{
                    command: 'processImage',
                    arguments: [imageData, slice, options]
                }, [imageData.data.buffer]]);
        }

       return Promise.all(this.workers.dispatch(messages)).then((results) => {
            for(var i = 0; i < results.length; i++) {
                ctx.putImageData(results[i], 0, chunk*i);
            }
        });
    }
}
