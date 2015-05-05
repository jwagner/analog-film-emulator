import {processImage} from './image-processing';

let clut;
var commands = {
    setClut: (clut_) => {
        clut = clut_;
    },
    processImage: (imageData, slice, options) => {
        //options.clut = clut;
        processImage(imageData, slice, options);
        self.postMessage(imageData, [imageData.data.buffer]);
    }
};

self.onmessage = function(e){
    commands[e.data.command].apply(self, e.data.arguments);
};
