import "babel/polyfill";
import 'console-polyfill';

import $ from 'jquery';

import App from './app';

window.$ = $;

// very little to see here, please move along
$(function(){
    window.app = new App($('.app'));

});

window.fbAsyncInit = function() {
    window.FB.init({
      appId      : '829087797183147',
      xfbml      : true,
      version    : 'v2.3'
    });
};
