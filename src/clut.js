import index from './clut.json';
import {getImageData, loadImage} from './image-helpers';

let lastUrl, lastPromise;

// contains an index of color lookup tables, and caches the last one used
let clut = {
    index: index,
    root: '',
    get: url => {
        if(url === lastUrl) return lastPromise;
        lastUrl = url;
        return lastPromise = loadImage(clut.root + url).then(image => getImageData(image));
    }
};

export default clut;
