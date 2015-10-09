import $ from 'jquery';
import Promise from 'bluebird';
import toBlob from 'canvas-to-blob';
import EXIF from 'exif-js';
toBlob.init();

// unprefix msToBlob
if(!HTMLCanvasElement.prototype.toBlob && HTMLCanvasElement.prototype.msToBlob){
    HTMLCanvasElement.prototype.toBlob = HTMLCanvasElement.prototype.msToBlob;
}

export function loadImage(url) {
    let img;
    return new Promise((resolve, reject) => {
        img = new Image();
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = reject;
    }).cancellable().catch(Promise.CancellationError, function(e) {
        img.onload = undefined;
        img.onerror = undefined;
        img.src = undefined;
        throw e; //Don't swallow it
    });
}

export function loadExif(blob){
    console.time('loadExif');
    return new Promise((resolve, reject) => {
        EXIF.getData(blob, function() {
            console.timeEnd('loadExif');
            resolve(this && this.exifdata);
        });
    });
}

export function loadImageFromBlob(blob, fixOrientation){
    let url = URL.createObjectURL(blob);
    if(!fixOrientation) return loadImage(url);
    return Promise.join(
            loadImage(url).delay(10),
            loadExif(blob).catch((e) => {
                console.error(e, 'error loading exif data');
            })
        ).then(([image, meta])=>{
            if(meta && meta.Orientation && meta.Orientation !== 1) {
                image = exifOrient(image, meta.Orientation);
                URL.revokeObjectURL(url);
            }
            return image;
        });
}

// tested against https://github.com/recurser/exif-orientation-examples
export function exifOrient(img, orientation){
    let c = document.createElement('canvas'),
        ctx = c.getContext('2d'),
        w = ~~(img.naturalWidth||img.width),
        h = ~~(img.naturalHeight||img.height);

    // set dimensions
    if(orientation < 5){
        c.width = w;
        c.height = h;
    }
    else {
        c.width = h;
        c.height = w;
    }
    // flip x
    if(orientation == 2 || orientation == 5 || orientation == 7){
        ctx.translate(c.width, 0);
        ctx.scale(-1, 1);
    }
    // flip y
    if(orientation == 4){
        ctx.translate(0, c.height);
        ctx.scale(1, -1);
    }

    function rotate(n){
        ctx.translate(c.width/2, c.height/2);
        ctx.rotate(Math.PI*n);
        ctx.translate(-c.width/2, -c.height/2);
    }
    if(orientation == 3) {
        rotate(1);
    }
    if(orientation == 5 || orientation == 6){
        rotate(0.5);
    }
    if(orientation == 7 || orientation == 8){
        rotate(-0.5);
    }
    // move it back to the corner
    if(orientation > 4){
        let o = (c.width - c.height)/2;
        ctx.translate(o, -o);
    }

    ctx.drawImage(img, 0, 0);
    c.naturalWidth = c.width;
    c.naturalHeight = c.height;
    return c;
}

export function getImageData(img){
    let c = document.createElement('canvas'),
        ctx = c.getContext('2d'),
        w = ~~img.naturalWidth,
        h = ~~img.naturalHeight;
    c.width = w;
    c.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h);
}

export function scaleImage(img, w, h){
    let c = document.createElement('canvas'),
        ctx = c.getContext('2d');
    c.width = w;
    c.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    return c;
}

// results in a much smoother image
export function scaleImageHQ(image, w, h) {
    let iw = (image.naturalWidth||image.width),
        ih = (image.naturalHeight||image.height);
    if(iw > w*2 && ih > h*2){
        image = scaleImage(image, w*2, h*2);
    }
    return scaleImage(image, w, h);
}


let downloadUrl,
    supportsDownload = document.createElement('a').download !== undefined;

export function downloadCanvas(canvas, type, quality, name){
    return new Promise((resolve, reject) => {
        if(canvas.toBlob) {
            canvas.toBlob((blob) => {
                    if(downloadUrl) URL.revokeObjectURL(downloadUrl);

                    if(navigator.msSaveBlob){
                        navigator.msSaveBlob(blob, name);
                        resolve();
                    }
                    else {
                        downloadUrl = URL.createObjectURL(blob);
                        if(supportsDownload){
                            download(downloadUrl, name);
                            resolve();
                        }
                        else {
                            resolve(downloadUrl);
                        }
                    }

                }, type, quality);
        }
        else {
            var url = canvas.toDataURL(type, quality);
            download(url, name);
            resolve();
        }
    });
}

function download(url, name){
    let a = $('<a>').attr({download: name||'photo.jpg', href: url, target: '_blank'}).text('download');
    $('body').append(a);
    // firefox seems to need these timeouts
    window.setTimeout(() => {
        a[0].click();
        window.setTimeout(() => {
            a.remove();
        }, 100);
    }, 100);
}
