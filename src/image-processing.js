import SimplexNoise from 'simplex-noise';

// From http://www.tannerhelland.com/4435/convert-temperature-rgb-algorithm-code/
function colorTemperatureToRGB(temperature){

    temperature *= 0.01;

    var r, g, b;

    if(temperature <= 66 ){

        r = 255;
        g = 99.4708025861 * Math.log(temperature) - 161.1195681661;
        if( temperature <= 19){
            b = 0;
        } else {
            b = 138.5177312231 * Math.log(temperature-10) - 305.0447927307;
        }
    } else {
        r = 329.698727446 * Math.pow(temperature-60, -0.1332047592);
        g = 288.1221695283 * Math.pow(temperature-60, -0.0755148492 );
        b = 255;
    }

    return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)];

}


function clamp(x, x0, x1) {
    return Math.min(Math.max(x, x0), x1);

}

export function addVignette(out, image, slice, radius, falloff, intensity){
    let od = out.data,
        id = image.data,
        w = image.width,
        h = image.height,
        ox = slice.x,
        oy = slice.y,
        sh = slice.height,
        sw = slice.width,
        scale = Math.min(slice.width, slice.height);

    for(var y = 0; y < h; y++) {
        let v = (y+oy-sh/2)/scale;
        v *= v;
        for(var x = 0; x < w; x++) {
            let i = (y*w+x)*4,
                h = (x+ox-sw/2)/scale;
            h *= h;
            let d = Math.sqrt(h+v);
            //let vignette = (1-Math.min(1, Math.max(0, (d-radius)/falloff)));
            let vignette = (1-Math.min(1, Math.max(0, (d-radius)/falloff))*(1-1/intensity));
            od[i] = dither(id[i]*vignette);
            od[i+1] = dither(id[i+1]*vignette);
            od[i+2] = dither(id[i+2]*vignette);
         }
    }

}

export function dither(value){
    var floorValue = Math.floor(value),
        remainder = value-floorValue;
    return (Math.random() > remainder) ? floorValue : Math.ceil(value);
}

export function addGrain(out, image, slice, scale, intensity){
    let simplex = new SimplexNoise();
    console.time('addGrain');
    let od = out.data,
        id = image.data,
        w = image.width,
        h = image.height,
        ox = slice.x,
        oy = slice.y,
        d = Math.min(slice.width, slice.height);

    for(var y = 0; y < h; y++) {
        for(var x = 0; x < w; x++) {
            // reduce noise in shadows and highlights, 4 = no noise in pure black and white
            let i = (y*w+x)*4,
                l = (id[i]+id[i+1]+id[i+2])/768-0.5,
                rx = x + ox,
                ry = y + oy,
                noise = (simplex.noise2D(rx/d*scale, ry/d*scale) +
                         simplex.noise2D(rx/d*scale/2, ry/d*scale/2)*0.25 +
                         simplex.noise2D(rx/d*scale/4, ry/d*scale/4))*0.5;
            // reduce noise in shadows and highlights, 4 = no noise in pure black and white
            noise *= (1-l*l*2);
            noise *= intensity*255;
            od[i] = id[i]+noise;
            od[i+1] = id[i+1]+noise;
            od[i+2] = id[i+2]+noise;
        }
    }
    console.timeEnd('addGrain');
}

export function adjustTemperature(out, image, temperature){
    let od = out.data, id=image.data,
        [rx, gx, bx] = colorTemperatureToRGB(temperature),
        lr = 0.2126,
        lg = 0.7152,
        lb = 0.0722,
        m = (rx*lr+gx*lg+bx*lb);
    rx = m/rx;
    gx = m/gx;
    bx = m/bx;
    for(var i = 0; i < od.length;i+=4){
        id[i] = od[i]*rx;
        id[i+1] = od[i+1]*gx;
        id[i+2] = od[i+2]*bx;
    }
}

export function adjust(out, image, brightness, contrast, saturation, vibrance, blacks) {
     console.time('adjust');
    var od = out.data, id=image.data,
        lr = 0.2126,
        lg = 0.7152,
        lb = 0.0722;

    brightness = brightness/(1-blacks);

    for(var i = 0; i < od.length;i+=4){
        // leave values gamma encoded, results are practically nicer
        let r = id[i]/255,
            g = id[i+1]/255,
            b = id[i+2]/255,
            l = (r*lr+g*lg+b*lb)/(lr+lg+lb);

        // blacks
        r = Math.max(0, r-blacks);
        g = Math.max(0, g-blacks);
        b = Math.max(0, b-blacks);

        // vibrance
        // red is overweighted to protect red tones (like skin) a bit more
        let s = Math.max(Math.abs(r-l)*2, Math.abs(g-l), Math.abs(b-l)),
            v = Math.max(0.5-s, 0)*vibrance*2;
        r += (r-l)*v;
        g += (g-l)*v;
        b += (b-l)*v;

        // saturation
        r += (r-l)*saturation;
        g += (g-l)*saturation;
        b += (b-l)*saturation;

        // contrast
        r += (r-0.5)*contrast;
        g += (g-0.5)*contrast;
        b += (b-0.5)*contrast;

        r *= brightness;
        g *= brightness;
        b *= brightness;

        od[i] = dither(r*255);
        od[i+1] = dither(g*255);
        od[i+2] = dither(b*255);
    }
    console.timeEnd('adjust');
}

export function mapColorsFast(out, image, clut){
    console.time('mapColorsFast');
    let od = out.data,
        id = image.data,
        w = out.width,
        h = out.height,
        cd = clut.data,
        cl = Math.floor(Math.pow(clut.width, 1/3)+0.001),
        cs = cl*cl,
        cs1 = cs-1;

    for(var y = 0; y < h; y++) {
        for(var x = 0; x < w; x++) {
            let i = (y*w+x)*4,
                r = id[i]/255*cs1,
                g = id[i+1]/255*cs1,
                b = id[i+2]/255*cs1,
                a = id[i+3]/255,
                ci = (dither(b)*cs*cs+dither(g)*cs+dither(r))*4;

            od[i] = cd[ci];
            od[i+1] = cd[ci+1];
            od[i+2] = cd[ci+2];
            od[i+3] = a*255;
        }
    }
    console.timeEnd('mapColorsFast');
}

export function noisy(n){
    return Math.min(Math.max(0, n+Math.random()-0.5), 255);
}

export function mapColors(out, image, clut){
    console.time('mapColors');
    let od = out.data,
        id = image.data,
        w = out.width,
        h = out.height,
        cd = clut.data,
        cl = Math.floor(Math.pow(clut.width, 1/3)+0.001),
        cs = cl*cl,
        cs2 = cs-2;

    let r_min_g_min_b_min = [0, 0, 0],
        r_min_g_min_b_max = [0, 0, 0],
        r_min_g_max_b_min = [0, 0, 0],
        r_min_g_max_b_max = [0, 0, 0],
        r_max_g_min_b_min = [0, 0, 0],
        r_max_g_min_b_max = [0, 0, 0],
        r_max_g_max_b_min = [0, 0, 0],
        r_max_g_max_b_max = [0, 0, 0];

    for(var y = 0; y < h; y++) {
        for(var x = 0; x < w; x++) {
            let i = (y*w+x)*4,
                // randomize these to avoid banding
                r = id[i]/256*cs2,
                g = id[i+1]/256*cs2,
                b = id[i+2]/256*cs2,
                a = id[i+3]/256,
                r0 = Math.floor(r),
                r1 = Math.ceil(r),
                g0 = Math.floor(g),
                g1 = Math.ceil(g),
                b0 = Math.floor(b),
                b1 = Math.ceil(b);

            sample(r_min_g_min_b_min, cd, cs, r0, g0, b0);
            sample(r_min_g_min_b_max, cd, cs, r0, g0, b1);
            sample(r_min_g_max_b_min, cd, cs, r0, g1, b0);
            sample(r_min_g_max_b_max, cd, cs, r0, g1, b1);
            sample(r_max_g_min_b_min, cd, cs, r1, g0, b0);
            sample(r_max_g_min_b_max, cd, cs, r1, g0, b1);
            sample(r_max_g_max_b_min, cd, cs, r1, g1, b0);
            sample(r_max_g_max_b_max, cd, cs, r1, g1, b1);

            let t = b-b0;
            rgbLerp(r_min_g_min_b_min, r_min_g_min_b_min, r_min_g_min_b_max, t);
            rgbLerp(r_min_g_max_b_min, r_min_g_max_b_min, r_min_g_min_b_max, t);
            rgbLerp(r_max_g_min_b_min, r_max_g_min_b_min, r_max_g_min_b_max, t);
            rgbLerp(r_max_g_max_b_min, r_max_g_max_b_min, r_max_g_min_b_max, t);

            t = g-g0;
            rgbLerp(r_min_g_min_b_min, r_min_g_min_b_min, r_min_g_max_b_min, t);
            rgbLerp(r_max_g_min_b_min, r_max_g_min_b_min, r_max_g_max_b_min, t);

            t = r-r0;
            rgbLerp(r_min_g_min_b_min, r_min_g_min_b_min, r_max_g_min_b_min, t);

            od[i] = (r_min_g_min_b_min[0]);
            od[i+1] = (r_min_g_min_b_min[1]);
            od[i+2] = (r_min_g_min_b_min[2]);
            od[i+3] = a*256;
        }
    }
    console.timeEnd('mapColors');
}

export function rgbLerp(out, x, y, t){
    out[0] = x[0]+(y[0]-x[0])*t;
    out[1] = x[1]+(y[1]-x[1])*t;
    out[2] = x[2]+(y[2]-x[2])*t;
}

export function sample(out, cd, cs, r, g, b){
    let ci = (b*cs*cs+g*cs+r)*4;
    out[0] = cd[ci];
    out[1] = cd[ci+1];
    out[2] = cd[ci+2];
}

export function processImage(data, slice, options){
    if(options.brightness && options.brightness !== 1 || options.contrast || options.saturation || options.vibrance || options.temperature || options.blacks){
        adjust(data, data, options.brightness||1, options.contrast||0, options.saturation||0, options.vibrance||0, options.blacks || 0);
    }
    if(options.temperature && options.temperature != 6500){
        adjustTemperature(data, data, options.temperature);
    }
    if(options.vignette && options.vignette.intensity > 0){
        addVignette(data, data, slice, options.vignette.radius, options.vignette.falloff, options.vignette.intensity);
    }
    if(options.grain && options.grain.intensity > 0) {
        addGrain(data, data, slice, options.grain.scale, options.grain.intensity);
    }
    if(options.clut){
        if(options.highQuality){
            mapColors(data, data, options.clut);
        }
        else {
            mapColorsFast(data, data, options.clut);
        }
    }
}
