import Promise from 'bluebird';
import {processImage} from '../image-processing';


export default class CanvasProcessor {
    constructor(canvas){
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
    }
    static isSupported(){
        return !!document.createElement('canvas').getContext;
    }
    supportedOptions(){
        return ['clut', 'brightness'];
    }
    process(image, options, progress=function(){}){
        let canvas = this.canvas,
            ctx = this.ctx,
            data;

        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;

        ctx.drawImage(image, 0, 0);

        data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let slice = {
                width: canvas.width,
                height: canvas.height,
                x: 0,
                y: 0
            };
        processImage(data, slice, options);
        ctx.putImageData(data, 0, 0);
        return Promise.resolve();
    }
}

