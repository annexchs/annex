;(function (window, Extensions, undefined) {
	'use strict';

    window.Extensions = Extensions;

    Extensions.Inst = Extensions.Inst || {};

    Extensions.isMobile = [Browser.Platform.webos,Browser.Platform.ios,Browser.Platform.android].contains(true);


    /**
     * Custom form elements
     * ====================
     *
     * @type {Class}
     */

	Extensions.CustomForm = new Class({
        Implements: Options,

        options: {},

		initialize: function(form, options) {
            this.setOptions(options);

			// Properties
            this.form       = form;
            this.elements   = this.form.getElements(this.options.elements.join(', '));
            this.zCount     = 500;

            // Vars
            var _this       = this;

            this.elements.each(function (el) {
                var type	= '_' + el.get('data-type');

                // If method exists for this form element type
                if (typeof _this[type] === 'function') {
                    _this[type](el);
                }
            });
		},

        // Display info dropdown on hover
        _hoverInfo: function(el) {
            var info        = el.getElement('.info');

            if (info === null) {
                return;
            }

            var _this       = this,
                container   = el.getParents('li')[0],
                position    = el.getStyle('position'),
                zIndex      = container.getStyle('z-index'),
                timeout;

            function focusOn() {
                clearTimeout(timeout);

                container.setStyles({
                    position: 'relative',
                    zIndex: _this.zCount++
                });

                info
                    .store('hovered', true)
                    .setStyle('display', 'block');

                // Transition here
                setTimeout(function () {
                    info.addClass('active');
                }, 0);
            }

            function focusOff() {
                info
                    .store('hovered', false)
                    // Transition here
                    .removeClass('active');

                timeout = setTimeout(function () {
                    info.setStyle('display', 'none');

                    container.setStyles({
                        position: position,
                        zIndex: zIndex
                    });
                }, 275);
            }

            // Hover/unhover events
            el.addEvents({
                mouseenter: focusOn,
                mouseleave: focusOff
            });
        },

        // Checkboxes
        _checkbox: function(el) {
            var input = el.getElement('input');

            input.addEvent('change', function () {
                el.toggleClass('active');
            });

            this._ieCheck(el, input);

            this._hoverInfo(el);
        },

        _radio: function(el) {
            var input       = el.getElement('input');

            input.addEvent('change', function () {
                this.form.getElements('input[name="'+ input.get('name') +'"]').each(function (radio) {
                    radio.getParent().removeClass('active');
                });

                el.addClass('active');
            });

            this._ieCheck(el, input);

            this._hoverInfo(el);
        },

        _ieCheck: function(el, input) {
            if (Browser.ie && Browser.version < 9) {
                el.addEvent('click', function () {
                    input.set('checked', !input.get('checked'));
                });
            }
        },

        _select: function(el) {
            var _this       = this,
                select      = el.getElement('select'),
                container   = el.getParent(),
                options     = select.getElements('option'),
                hasDisabled = options[0].getProperty('disabled'),
                i           = +hasDisabled,
                children    = [];

            // Original styles
            var cStyle  = container.getStyles('position', 'z-index'),
                elStyle = el.getStyles('position', 'z-index');

            // Info list
            var info    = new Element('ul', {
                'class': 'info'
            });

            // Selection text
            var inner   = new Element('span', {
                'class': 'inner',
                text: options[select.selectedIndex].get('text')
            });

            // Add option list
            for (; i < options.length; i++) {
                children.push(
                    new Element('li').adopt(
                        new Element('a', {
                            href: '#',
                            text: options[i].get('text')
                        })
                    )
                )
            }

            // Add list items
            info.adopt(children);

            el.adopt(
                inner,
                new Element('i', {
                    'class': 'ss-icon ss-standard',
                    html: '&#xF501;'
                }),
                info
            );

            info.getElements('a').addEvent('click', function (e) {
                e.preventDefault();

                // Get selected index
                var index = children.indexOf(this.getParent()) + (hasDisabled ? 1 : 0);

                // Set value
                select.set('value', options[index].get('value'));

                // Update inner text
                inner.set('text', this.get('text'));

                info.removeClass('active');

                setTimeout(function () {
                    if (!info.retrieve('hovered')) {
                        info.setStyle('display', 'none');
                    }
                }, 275);
            });

            this._hoverInfo(el);
        }
	});
    /**
     * Hexagons
     * ========
     *
     * @type {Class}
     */

    Extensions.Hexagons = new Class({
        Implements: [Options, Events],

        options: {
            duration: 250
        },

        initialize: function(list, options) {
            this.setOptions(options);

            this.list       = list;
            this.listItems  = list.getElements('div.hex');
            this.hexLinks   = list.getElements('a');
            this.section    = this.list.getParents('section')[0];

            // Setup hover interaction
            this._hoverEvents();

            if (this.section.get('data-interactive') !== null) {
                this.interact();
            }
        },

        _doFade: function(elems, toOpacity) {
            elems.each(function (el) {
                el
                    .set('tween', {
                        duration: 250
                    })
                    .get('tween')
                    .start('opacity', toOpacity);
            });
        },

        interact: function() {
            // Fires once on scroll past
            this.section.addEvent('interact', this.fadeIn.bind( this ));
        },

        fadeIn: function(){
            var lis = this.listItems;

            this.fadeInAndRemove.delay( 100 , this , [lis] );
        },

        fadeInAndRemove: function( lis ){
            var show = Math.floor(Math.random() * (lis.length - 1));

            lis[show].set('tween',{duration:400}).tween('opacity' , 1);
            lis[show] = null;
            lis = lis.clean();
            if ( lis.length === 0 ) {
                return;
            }
            this.fadeInAndRemove.delay( 100 , this , [lis] );
        },

        _hoverEvents: function() {
            var _this = this,
                hoverOpacity = Modernizr.opacity ? .88 : 1; // Prevent janky text-rendering in IE < 9

            this.hexLinks.each(function (a) {
                var toFade,
                    opacityArr;

                if (a.getParent().hasClass('invert')) {
                    toFade = a.getElements('.inner, .after');

                    opacityArr = [hoverOpacity, 0];
                } else {
                    toFade = a.getElements('.after');

                    opacityArr = [hoverOpacity, 1];
                }

                a.addEvents({
                    mouseenter: function () {
                        _this._doFade(toFade, opacityArr[0]);
                    },

                    mouseleave: function () {
                        _this._doFade(toFade, opacityArr[1]);
                    }
                });
            });
        }
    });
