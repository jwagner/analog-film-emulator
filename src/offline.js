export var supported = 'serviceWorker' in navigator;
export function enable(){
    return navigator.serviceWorker.register('service-worker.js', {scope: './'});
}

export function isEnabled(){
}

export function disable(){
}
