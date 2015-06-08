import $ from 'jquery';
import _ from 'underscore';

import Editor from './editor';
import Settings from './settings';
import {isTouch} from './responsive-helpers';
import {loadImage, loadImageFromBlob} from './image-helpers';

// this is the main ui class,
// mostly taking care of wiring and plumbing for the main actions
// takes uploads from the user and dispatches them to the editor
// takes requests for download and dispatches them to the editor
export default class App {
    constructor(el){
        this.el = el;
        this.editor = new Editor($('.editor', el));
        this.settings = new Settings($('.settings', el));
        this.fileType = '';
        this.fileName = '';
        this.content = 'editor';

        $(window).resize(_.debounce(() => this.editor.render(), 500));
        // hack to make title bar hideable on android
        if(navigator.userAgent.match(/android/i)){
            $(window).on('scroll', _.debounce(function(){
                if($(window).scrollTop()>25){
                    $('body').css('margin-bottom', '0');
                }
                else {
                    $('body').css('margin-bottom', '50px');
                }
            }, 200));
            $('body').css('margin-bottom', '50px');
        }

        $('input[type=file]', el).change((e) => this.handleFiles(e.target.files));
        $('.download-action', el).click((e) => {
            $('.download-progress', el).show();
            let type = this.fileType == 'image/png' ? 'image/png' : 'image/jpeg';
            this.editor.download(this.fileName || 'photo.jpg', type, this.settings.data.jpegQuality, ()=>{}).then((url) => {
                // browser does not support triggering downloads
                if(url){
                    $('.download-image', this.el).empty().append($('<img>').attr('src', url));
                    if(isTouch()){
                        $('.download-touch', this.el).show();
                        $('.download-mouse', this.el).hide();
                    }
                    else {
                        $('.download-touch', this.el).hide();
                        $('.download-mouse', this.el).show();
                    }
                    this.showContent('download');
                }
                $('.download-progress', el).hide();
            });
        });
        $('.editor-action', el).click(() => this.showContent('editor') );
        $('.settings-action', el).click(() => this.showContent('settings') );
        $('.help-action', el).click(() => this.showContent('help') );

        this.settings.onchange = (settings) => {
            this.dispatchSettings(settings);
        };
        this.dispatchSettings(this.settings.data);

        $('html')
            .on('dragover', (e) => { e.preventDefault(); })
            .on('drop', (e) => {
                var files = e.originalEvent.dataTransfer.files;
                this.handleFiles(files);
                return false;
            });

        loadImage('samples/cup.jpg').then((image) => this.editor.setImage(image));
        //$('.clut-select').val('clut/bw-ilford_delta_400.png').change();
    }
    dispatchSettings(settings){
        console.log('settings', settings);
        this.editor.setHighQualityPreview(settings.highQualityPreview);
        this.editor.setShowAdvancedControls(settings.showAdvancedControls);
    }
    handleFiles(files){
        if (files.length > 0) {
            let file = files[0];
            this.fileType = file.type;
            this.fileName = file.name;
            loadImageFromBlob(file, true).then((image) => {
                this.editor.setImage(image);
                this.showContent('editor');
            });
        }
    }
    showContent(name){
        if(name === this.content) name = 'editor';
        this.content = name;
        $('.app-content>*', this.el).hide();
        $('.app-content>.' + name, this.el).show();
        if(name === 'editor') this.editor.render();
    }

}
