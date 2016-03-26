import $ from 'jquery';
import _ from 'underscore';
import clut from './clut';
import {trackEvent} from './analytics';
import {isSmall} from './responsive-helpers';

// performs a simple mapping from the html input elements
// to a javascript options objects that is then consumed by
// the editor for rendering
class Controls {
    constructor(el) {
        this.el = el;
        this.basicControls = ['clut', 'brightness', 'contrast', 'temperature', 'vibrance', 'grain', 'vignette', 'lightLeak'];
        this.inputs = [
            new ClutControl('clut', 'Film'),
            new RangeControl('clutMix', 'Film Effect Strength', 0.0, 1.0, 1.0),
            new RangeControl('grain', 'Grain', 0, 0.5, 0),
            new RangeControl('grainScale', 'Grain Scale', 0.01, 2, 1),
            new RangeControl('vignette', 'Vignette', 0, 10, 0),
            new RangeControl('vignetteRadius', 'Vignette Radius', 0.01, 2, 1),
            new RangeControl('lightLeak', 'Light Leak', 0, 2, 0),
            new RangeControl('lightLeakIntensity', 'Light Leak Intensity', 0, 2, 1),
            new RangeControl('lightLeakScale', 'Light Leak Scale', 0.25, 1, 4),
            new RangeControl('brightness', 'Brightness', 0, 2, 1),
            new RangeControl('blacks', 'Blacks', -0.5, 0.5, 0),
            new RangeControl('contrast', 'Contrast', -1, 1, 0),
            new RangeControl('temperature', 'Temperature', 3000, 25000, 6500, 1),
            new RangeControl('vibrance', 'Vibrance', -1, 1, 0),
            new RangeControl('saturation', 'Saturation', -1, 1, 0),
        ];
        this.inputsByName = _.indexBy(this.inputs, 'name');

        this.selectedControl = this.inputs[0];
        this.selectControl(this.inputs[0]);

        this.selector = new Selector($('.editor-control-selector'), this.inputs);
        this.selector.onSelect = (selectedName) => {
            this.selectControl(this.inputsByName[selectedName]);
        };
        $(el).on('click', '.editor-control p', () => {
            if(isSmall()){
                this.selector.toggle();
            }
        });

        this.setShowAdvancedControls(false);
        $(el).append(this.inputs.map((e) => e.el));
        $('input,select', el).change((e) => {
            if(e.target && e.target.name){
                trackEvent({action: 'changeParameter', label: e.target.name, interaction: true});
            }
            return this.change();
        });

        this.bypass = false;
        var bypassOn = $('.editor-control-bypass-on').click((e) => {
            this.bypass = false;
            bypassOn.hide();
            bypassOff.show();
            this.change();
        });
        var bypassOff = $('.editor-control-bypass-off', el).click((e) => {
            this.bypass = true;
            bypassOn.show();
            bypassOff.hide();
            this.change();
        });

        this.change();
    }
    selectControl(control){
        this.selectedControl.el.removeClass('editor-control-selected');
        this.selectedControl = control;
        control.el.addClass('editor-control-selected');
    }
    setShowAdvancedControls(showAdvancedControls) {
        this.showAdvancedControls = showAdvancedControls;
        let isBasic = (c) => this.basicControls.indexOf(c.name) > -1;
        for(let control of this.inputs){
            if(showAdvancedControls || isBasic(control)){
                control.show();
            }
            else {
                control.hide();
                control.reset();
            }
        }
        let controls = this.inputs;
        if(!showAdvancedControls){
            controls = _.filter(controls, (c) => isBasic(c));
        }
        this.selector.setItems(controls.map((c) => {
            return {id: c.name, text: c.text};
        }));
    }
    change(){
        this.options = {};
        if(!this.bypass){
            for(let input of this.inputs){
                this.options[input.name] = input.value();
            }
        }
        this.onchange(this.options);
    }
    onchange(options){
    }
}

class Selector {
    constructor(el, items) {
        this.el = el;
        this.setItems(items);
        this.onselect = () => {};
        this.el.on('click', '.editor-control-selector-item', (e) => {
            this.hide();
            this.onSelect($(e.target).data('item-id'));
        });
    }
    setItems(items){
        this.items = items;
        this.el.empty();
        for(let item of items){
            let el = $('<div class=editor-control-selector-item></div>')
                    .text(item.text)
                    .data('item-id', item.id);
            this.el.append(el);
        }
    }
    toggle() {
        if(this.el.is(':visible')){
            this.hide();
        }
        else {
            this.show();
        }
    }
    show() {
        this.el.fadeIn('fast');
        setTimeout(() => {
            $(document).one('click', () => {
                this.hide();
            });
        }, 1);
    }
    hide(){
        this.el.fadeOut('fast');
    }
}

class Control {
    constructor(name, text) {
        this.name = name;
        this.text = text;
        this.label = $('<p>').text(text);
        this.el = $('<div class=editor-control></div>');
        this.el.append(this.label);
        this.input = null;
    }
    show() {
        this.el.css({display: ''});
    }
    hide(){
        this.el.css({display: 'none'});
    }
    reset(){
        this.input.val(this.input.attr('value')).change();
    }
    value() {
        return this.input.val();
    }
}

class RangeControl extends Control {
    constructor(name, text, min, max, val, step=0.001){
        super(name, text);
        this.input = $('<input type=range>').prop({
            name: name,
            min: min,
            max: max,
            value: val,
            step: step
        }).attr('value', val).val(val);
        this.el.append(this.input);
        $(this.input).dblclick(() => this.reset());
    }
    value() {
        return this.input.val()*1;
    }
}

class ClutControl extends Control {
    constructor(name, text) {
        super(name, text);
        //$(this.label).append('<span class=help-action>*</span>');
        this.input = $('<select class=clut-select>')
            .attr('name', name)
            .append($('<option>').text('None').attr('value', 'clut/identity.png'))
            .append(clut.index.map((category) => {
                return $('<optgroup>')
                    .attr('label', category.name)
                    .append(category.cluts.filter((clut) => !clut.name.match(/(\+|\-)( Alt)?$/)).map((clut) => {
                        return $('<option>').text(clut.name).attr('value', clut.path);
                    }));
            }));
        this.el.append(this.input);
    }
}

export default Controls;
