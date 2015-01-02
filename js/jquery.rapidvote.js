/*
 * jQuery Rapid Vote Plugin
 *
 * Copyright (c) 2014 Serge Liskovsky
 *
 * Licensed under the GNU GENERAL PUBLIC LICENSE 2:
 * https://www.gnu.org/licenses/gpl2.html
 *
 * Project home:
 * https://github.com/prostosergik/rapidvote/
 *
 * Version: 1.1
 *
 */

;(function (factory) {

  if(typeof define==='function' && define.amd){
    // AMD
    define(['jquery'], factory);
  }else if(typeof exports==='object') {
    // CommonJS
    factory(require('jquery'));
  }else {
    // Browser globals
    factory(jQuery);
  }
}(function($){
    'use strict';

    // Default options
    var defaults = {
        get_url: 'get_data.php?poll_id=',
        save_url: 'save_data.php?poll_id=',
        template: '<div class="rapidvote_button {{button_key}}">\
                    <div class="button_label">\
                        {{button_label}}\
                        <span class="votes">{{button_value}}</span>\
                    </div>\
                    <div class="social_buttons">\
                        <div class="share_text">{{share_text}}</div>\
                        <div class="share_label">Share in social media:</div>\
                        <div class="share_buttons">\
                            <a href="javascript:void(0);" target="_blank" class="share_button share_button_twitter">&nbsp;</a>\
                            <a href="javascript:void(0);" target="_blank" class="share_button share_button_facebook">&nbsp;</a>\
                        </div>\
                    </div>\
                </div>',
        share_text: 'Hey! I just voted "{{button_label}}" on '+document.location.hostname+'!',
        only_render: false,
        csrf: false,
        buttons: {
            'yes':  { label:'Yes',  value: 0},
            'no':   { label:'No',   value: 0},
            'mayb': { label:'MayB', value: 0}
        }
    };

    //Private methods.
    var _jsonp_request = function(url) {
        $('<script type="text/javascript"></script>').attr('src', url).appendTo('head');
    };

    //check if this button was already incremented
    var _localStorageIsIncremented = function(namespace, button_key) {

        var widgetLsObj = JSON.parse(window.localStorage.getItem('ns_'+namespace));

        if(!widgetLsObj) {
            return false;
        }

        return widgetLsObj[button_key];
    }

    //store state
    var _localStorageSet = function(namespace, button_key, is_increment){

        var widgetLsObj = JSON.parse(window.localStorage.getItem('ns_'+namespace));

        if(!widgetLsObj) {
            widgetLsObj = {};
        }

        widgetLsObj[button_key] = is_increment;

        window.localStorage.setItem('ns_'+namespace, JSON.stringify(widgetLsObj));
    }


    // Constructor
    var RapidVote = function(element, options) {
        this.element = element;
        this.options = options;

        this.poll_id = typeof(options.poll_id) != 'undefined' ? options.poll_id : this.element.attr('data-poll-id');
    };

    // Plugin public methods and shared properties
    RapidVote.prototype = {
        // Reset constructor
        constructor: RapidVote,

        //add basic events after instance created
        init: function() {

            //close event for share window
            $(document).on('click', function(){
                $('div.social_buttons').fadeOut();
            });

            //close on escape key
            $(document).on('keydown', function(e) {
                //esc
                if (e.keyCode == 27) {
                    $('div.social_buttons').fadeOut();
                }
            });

            this.render();
        },

        //get buttons data and force render with all options that can be changed. Can accept buttons object as option.
        render: function(buttons) {

            if(buttons) {
                this.options.buttons = buttons;
            }

            this.element.html('Loading...');

            //init buttons
            $.each(this.options.buttons, function(key, button) {
                if(!button.value) {
                    button.value = 0;
                }
            });

            var req_url = this.options.get_url+
                          this.poll_id+
                          (this.options.get_url.search(/\?/) != -1 ? '&' : '?')+
                          (this.options.csrf ? 'csrf='+this.options.csrf : '');

            _jsonp_request(req_url);
        },

        //init buttons values after recieving it with JSONp
        get_buttons_data: function(data){
            $.each(this.options.buttons, function(key, button) {
                if(data.buttons[key] != undefined) {
                    button.value = data.buttons[key];
                }
            });

            this.draw();
        },


        //after button submitted.
        set_buttons_data: function(data){

            var $button = this.element.find('div.rapidvote_button.'+data.button);
            var $share_window = this.element.find('div.'+data.button+' div.social_buttons');

            //show share
            if(data.incremented) {

                //if position should be under
                if($share_window.outerHeight() > ($button.offset().top - $(document).scrollTop())) {
                    $share_window.addClass('under');
                } else {
                    $share_window.removeClass('under');
                }

                var button_margin_right = parseInt($button.find('div.button_label').css('margin-right')) || 20;

                if($share_window.outerWidth() > ($(document).width() - $button.offset().left)-$button.outerWidth() + button_margin_right) {
                    $share_window.addClass('right');
                } else {
                    $share_window.removeClass('right');
                }

                //close others
                $('div.social_buttons').fadeOut();
                $share_window.off('click').on('click', function(e) { e.stopPropagation(); });
                $share_window.fadeIn();
            } else {
                $share_window.fadeOut();
            }
            //save storage and update value on button
            _localStorageSet(data.poll_id, data.button, data.incremented);
            this.element.find('div.'+data.button+' span.votes').html(data.buttons[data.button]);
        },


        draw: function() {

            var $this = this;
            var $el = this.element;

            $el.html('');

            $.each(this.options.buttons, function(key, button) {

                var share_text = $this.options.share_text;
                share_text = share_text.replace(/{{button_label}}/g, button.label);

                var button_html = ($($this.options.template).selector) ? $($this.options.template).html() : $this.options.template; //let jQuery do all magic to get HTML for us from text/template or jqyery selector or html string

                button_html = button_html.replace(/{{share_text}}/g, share_text);
                button_html = button_html.replace(/{{button_key}}/g, key);
                button_html = button_html.replace(/{{button_label}}/g, button.label);
                button_html = button_html.replace(/{{button_value}}/g, button.value);

                var $button = $(button_html);

                //only render mode -  only draws buttons.
                if(!$this.options.only_render) {

                    $button.find('div.button_label').off('click');
                    $button.find('div.button_label').on('click', function(e){
                        e.stopPropagation();

                        var is_incremented = _localStorageIsIncremented($this.poll_id, key);

                        if(is_incremented) {
                            button.value--;
                        } else {
                            button.value++;
                        }

                        //storage values will be saved after callback executed.
                        //TODO: add check for question mark in URL!
                        var req_url = $this.options.save_url+
                                      $this.poll_id+
                                      ($this.options.save_url.search(/\?/) != -1 ? '&' : '?')+'button='+key+
                                      '&action='+(is_incremented ? 'dec' : 'inc')+
                                      ($this.options.csrf ? '&csrf='+$this.options.csrf : '');

                        _jsonp_request(req_url);

                    });


                    $button.find('.share_button_twitter').off('click');
                    $button.find('.share_button_twitter').on('click', function(e){
                        e.preventDefault();
                        e.stopPropagation();
                        var url="https://twitter.com/intent/tweet?text="+encodeURIComponent(share_text)
                        window.open(url, 'Twitter', 'width=630,height=280,scrollbars=no,toolbar=no,location=no,menubar=no');
                    });

                    $button.find('.share_button_facebook').off('click');
                    $button.find('.share_button_facebook').on('click', function(e){
                        e.preventDefault();
                        e.stopPropagation();
                        var url = "https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(document.location.href);
                        window.open(url, 'Share on Facebook', "width=800,height=450,menubar=no,location=no,resizable=no,scrollbars=no,status=no");
                    });

                }

                $button.appendTo($el);
            });

        }

    }


    $.rapidvote = {};

    // Create the jQuery plugin
    $.fn.rapidvote = function(options) {

        //merge defaults and options
        // options = $.extend(false, {}, defaults, options);
        options = $.extend(false, {}, defaults, options);

        return this.each(function() {
            var $this = $(this); //element

            var instance = new RapidVote($this, options);

            $this.data('rapidvote', instance);
            $.rapidvote[instance.poll_id] = instance;

            instance.init();
        });
    };

    // Expose defaults and Constructor (allowing overriding of prototype methods for example)
    $.fn.rapidvote.defaults = defaults;
    $.fn.rapidvote.RapidVote = RapidVote;

    //register JSONp Data Callback functions
    $.rapidvoteGetJSONpDataCallback = function(poll_id, data){

        if( typeof(poll_id) == undefined || poll_id == '' || typeof(data) == undefined || typeof(data.status) == undefined) {
            console.log('RapidVote: Wrong callback options for buttons data.');
            return;
        } else if(data.status == 0) {
            console.log('RapidVote Error: '+data.errors);
            return;
        }

        $.rapidvote[poll_id].get_buttons_data(data);
    };

    $.rapidvoteSetJSONpDataCallback = function(poll_id, data){

        if( typeof(poll_id) == undefined || poll_id == '' || typeof(data) == undefined || typeof(data.status) == undefined) {
            console.log('RapidVote: Wrong callback options for buttons data.');
            return;
        } else if(data.status == 0) {
            console.log('RapidVote Error: '+data.errors);
            return;
        }

        $.rapidvote[poll_id].set_buttons_data(data);
    };

    })
);


//fix for old browsers. Cookies immitation of localStorage
if (!window.localStorage) {
  window.localStorage = {
    getItem: function (sKey) {
      if (!sKey || !this.hasOwnProperty(sKey)) { return null; }
      return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
    },
    key: function (nKeyId) {
      return unescape(document.cookie.replace(/\s*\=(?:.(?!;))*$/, "").split(/\s*\=(?:[^;](?!;))*[^;]?;\s*/)[nKeyId]);
    },
    setItem: function (sKey, sValue) {
      if(!sKey) { return; }
      document.cookie = escape(sKey) + "=" + escape(sValue) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";
      this.length = document.cookie.match(/\=/g).length;
    },
    length: 0,
    removeItem: function (sKey) {
      if (!sKey || !this.hasOwnProperty(sKey)) { return; }
      document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      this.length--;
    },
    hasOwnProperty: function (sKey) {
      return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    }
  };
  window.localStorage.length = (document.cookie.match(/\=/g) || window.localStorage).length;
}