export function trackEvent(options){
    if(!window._gaq) return;
    console.log('trackEvent', options);
    window._gaq.push(['_trackEvent',
                     options.category || 'FilmEmulator',
                     options.action,
                     options.label,
                     options.value,
                     !options.interaction
    ]);
}

