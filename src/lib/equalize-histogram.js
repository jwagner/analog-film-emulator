var histogram = new Uint32Array(256),
    equalization = new Uint8Array(256);

export default function equalizeHistogram(buffer, offset=0, stride=1, mix=1){
    var i, runningSum = 0;
    for(i = 0; i < histogram.length; i++) {
        histogram[i] = 0;
    }
    for(i = offset; i < buffer.length; i+=stride) {
        histogram[buffer[i]]++;
    }
    var perBin = Math.floor((buffer.length-offset)/stride)/histogram.length,
        min = Math.floor(histogram[0]/perBin),
        scale = histogram.length/(histogram.length-min);
    for(i = 0; i < histogram.length; i++){
        runningSum += histogram[i];
        equalization[i] = Math.min((Math.floor(runningSum/perBin)-min)*scale, 255);
    }
    for(i = offset; i < buffer.length; i+=stride) {
        buffer[i] = buffer[i]*(1-mix)+equalization[buffer[i]]*mix;
    }
}
