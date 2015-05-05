import $ from 'jquery';

export function isSmall(){
    return window.matchMedia && matchMedia('(max-width: 767px)').matches;
}
export function isIos(){
    return !!navigator.userAgent.match(/iPhone|iPad|iPod/i);
}

let hasBeenTouched = false;
$(document).one('touchstart', (e) => { hasBeenTouched = true; } ); 

export function isTouch(){
    return hasBeenTouched;
}
