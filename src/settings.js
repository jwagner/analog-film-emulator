import $ from 'jquery';
const SETTINGS_KEY = 'ch.29a.filmEmulator.settings';
export default class Settings {
    constructor(el) {
        this.el = el;
        this.data = {};
        this.controls = {
            jpegQuality: $('input[name="jpegQuality"]', this.el),
            highQualityPreview: $('input[name="highQualityPreview"]', this.el),
            showAdvancedControls: $('input[name="showAdvancedControls"]', this.el)
        };
        this.onchange = () => {};
        this.load();
        this.update();
        $(el).on('change', 'input', () => {
            this.update();
        });
    }
    load(){
        try {
            if(window.localStorage){
                let text = window.localStorage.getItem(SETTINGS_KEY);
                if(text) {
                    let data = JSON.parse(text);
                    this.controls.jpegQuality.val(data.jpegQuality*100);
                    this.controls.highQualityPreview.prop('checked', data.highQualityPreview);
                    this.controls.showAdvancedControls.prop('checked', data.showAdvancedControls);
                }
            }
        }
        catch(e) {
            console.error(e, 'error loading settings');
        }
    }
    save() {
        try {
            if(window.localStorage){
                let json = JSON.stringify(this.data);
                window.localStorage.setItem(SETTINGS_KEY, json);
            }
        }
        catch(e) {
            console.error(e, 'error saving settings');
        }
    }
    update(){
        this.data.jpegQuality = this.controls.jpegQuality.val()*0.01;
        this.data.highQualityPreview = this.controls.highQualityPreview.prop('checked');
        this.data.showAdvancedControls = this.controls.showAdvancedControls.prop('checked');
        this.save();
        this.onchange(this.data);
    }
}
