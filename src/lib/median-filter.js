export default function medianFilter(input, output, offset, stride, length){
    var start = offset+stride,
        end = offset+length-stride,
        a, b, c;
    // handle boundaries
    output[offset] = input[offset];
    output[end] = input[end];
    for(var i = start; i < end; i+=stride){
        a = input[i-stride];
        b = input[i];
        c = input[i+stride];
        // I found this hack in some old programming competition code of mine,
        // I'll try to find the source.
        var max = Math.max(Math.max(a,b),c),
            min = Math.min(Math.min(a,b),c),
            // the max and the min value cancel, the median remains
            median = a^b^c^max^min;
        output[i] = median;
    }
}
