import $ from 'jquery';
import _ from 'underscore';
import Promise from 'bluebird';

import {scaleImageHQ, downloadCanvas} from './image-helpers';
import Controls from './controls';
import {isSmall, isIos} from './responsive-helpers';
import CanvasProcessor from './process/canvas-processor';
import CanvasWorkerProcessor from './process/canvas-worker-processor';
import clut from './clut';

// The editor gets images from the app
// takes the options from the controls
// and passes them to the processor for rendering
export default class Editor {
    constructor(el) {
        this.el = el;
        this.outputCanvas = $('.photo-canvas', el)[0];
        this.processorCanvas = document.createElement('canvas');
        this.processor = this.getSupportedProcessor(this.processorCanvas);
        this.controls = new Controls($('.editor-controls', el));
        this.controls.onchange = _.debounce(() => this.render(), 100);
        this.inputImage = null;
        this.scaledImage = null;

        this.lastOptions = 0;
        this.lastWidth = 0;
        this.lastHeight = 0;
        this.lastImage = null;
        this.highQualityPreview = false;

        this.renderPending = false;
        this.renderInProgress = false;
    }
    setHighQualityPreview(highQualityPreview) {
        this.highQualityPreview = highQualityPreview;
        this.render();
    }
    setShowAdvancedControls(showAdvancedControls){
        this.controls.setShowAdvancedControls(showAdvancedControls);
    }
    getSupportedProcessor(canvas){
        //return new CanvasProcessor(canvas);
        let Processor = _.find([CanvasWorkerProcessor, CanvasProcessor], (p) => p.isSupported());
        return new Processor(canvas);
    }
    setImage(image){
        if(this.inputImage && this.inputImage.src && this.inputImage.src.slice(0,5) == 'blob:'){
            URL.revokeObjectURL(this.inputImage.src);
        }
        this.inputImage = image;
        this.scaledImage = null;
        this.render();
    }
    getOptions(w, h){
        let o = this.controls.options,
            basic = !this.controls.showAdvancedControls;
        return Promise.resolve(o.clut && o.clut !== 'clut/identity.png' && clut.get(o.clut)).cancellable().then((clut) => {
            return {
                clut: clut,
                highQuality: this.highQualityPreview,
                brightness: o.brightness,
                saturation: o.saturation,
                contrast: o.contrast,
                vibrance: o.vibrance,
                blacks: o.blacks,
                temperature: o.temperature,
                // divide grain scale by image scale so the preview more or less matches the original
                grain: {scale: 1600*(o.grainScale||1), intensity: o.grain},
                vignette: {
                    radius: 0.4*(o.vignetteRadius||1),
                    falloff: Math.sqrt(1+Math.pow(Math.max(w,h)/Math.min(w,h), 2))*0.5-0.4,
                    intensity: Math.pow(2, o.vignette)
                },
                lightLeak: {
                    seed: o.lightLeak,
                    intensity: basic ? o.lightLeak : o.lightLeakIntensity,
                    scale: o.lightLeakScale || 1
                }
            };
        });
    }
    getCanvasSize(image) {
        let pixelRatio = Math.min(window.devicePixelRatio||1, 2),
            padding = $(this.outputCanvas).css('border-width').charAt(0) != '0' ? 50 : 0;

        // we need to hide the output canvas so it doesn't stretch it's parent (.editor-photo)
        $(this.outputCanvas).hide();

        let availableW = Math.min((~~$('.editor-photo', this.el).innerWidth()-padding), 1024)*pixelRatio,
            availableH = Math.min((~~$('.editor-photo', this.el).innerHeight()-padding), 1024)*pixelRatio,
            scale = Math.min(availableW/image.width, availableH/image.height, 1),
            w = ~~(image.width * scale),
            h = ~~(image.height * scale);

        $(this.outputCanvas).show();

        if(isIos()){
            w = Math.min(w, 1000);
            h = Math.min(h, 1000);
        }


        return [w, h, w/pixelRatio, h/pixelRatio];
    }
    render() {
        if(!this.inputImage) return;
        if(this.renderPending) {
            console.log('render already pending');
            return;
        }
        if(this.renderInProgress){
            console.log('render already in progress, setting pending');
            this.renderPending = true;
            return;
        }

        let [w, h, wc, hc] = this.getCanvasSize(this.inputImage),
            options = this.getOptions(w, h);

        if(w <= 0 || h <= 0){
            console.log('editor is not visible, not rendering');
            return;
        }


       if(w === this.lastWidth && h === this.lastHeight && this.lastImage == this.inputImage && _.isEqual(this.lastOptions, this.controls.options)){
            console.log('result render would be the same as the last call', this.controls.options);
            return;
       }
       this.renderInProgress = true;
       this.lastWidth = w;
       this.lastHeight = h;
       this.lastOptions = this.controls.options;
       this.lastImage = this.inputImage;

       if(!this.scaledImage || this.scaledImage.w !== w || this.scaledImage.h !== h || this.inputImage !== this.lastImage){
            this.scaledImage = scaleImageHQ(this.inputImage, w, h);
       }


       $(this.outputCanvas).css({width: wc + 'px', height: hc + 'px'});
        $('.photo-rendering', this.el).show();

        console.time('Editor.render');
        options
            .then((options) => {
                return this.processor.process(this.scaledImage, options);
            })
            .then(() => {
                this.outputCanvas.width = w;
                this.outputCanvas.height = h;
                this.outputCanvas.getContext('2d').drawImage(this.processorCanvas, 0, 0);
            })
            .finally(() => {
                console.timeEnd('Editor.render');
                this.renderInProgress = false;
                $('.photo-rendering', this.el).hide();
                if(this.renderPending) {
                    this.renderPending = false;
                    return this.render();
                }
            });
    }
    download(name, type, quality, progress) {
        console.time('download');
        let image = this.inputImage,
            canvas = document.createElement('canvas'),
            options = this.getOptions(image.naturalWidth, image.naturalHeight),
            downloadOptions = {highQuality: !isSmall()},
            processor = this.getSupportedProcessor(canvas);

        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.width;

        return options.then((options) => {
            _.extend(options, downloadOptions);
            return processor.process(image, options, progress);
        }).then(() => {
            return downloadCanvas(canvas, type, quality, name);
        }).then((url) => {
            console.timeEnd('download');
            return url;
        });
    }
}
