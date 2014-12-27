
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
        buttons: {
            'yes': {label:'Yes', value: 0},
            'no': {label:'No', value: 0},
            'mayb': {label:'MayB', value: 0}
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


    // Constructor, initialise everything you need here
    var RapidVote = function(element, options) {
        this.element = element;
        this.options = options;
        this.buttons = options.buttons;

        this.poll_id = typeof(options.poll_id) != 'undefined' ? options.poll_id : this.element.attr('data-poll-id');

    };

    // Plugin public methods and shared properties
    RapidVote.prototype = {
        // Reset constructor
        constructor: RapidVote,


        init: function() {
            this.element.html('Loading...');

            //init buttons
            $.each(this.buttons, function(key, button) {
                if(!button.value) {
                    button.value = 0;
                }
            });

            _jsonp_request(this.options.get_url+this.poll_id);
        },

        get_buttons_data: function(data){
            $.each(this.buttons, function(key, button) {
                if(data.buttons[key] != undefined) {
                    button.value = data.buttons[key];
                }
            });

            this.draw();
        },

        set_buttons_data: function(data){
            _localStorageSet(data.poll_id, data.button, data.incremented);
            this.element.find('div.'+data.button+' span.votes').html(data.buttons[data.button]);
        },


        draw: function() {

            var $this = this;
            var $el = this.element;

            $el.html('');

            $.each(this.buttons, function(key, button) {
                var $button = $('<div class="rapidvote_button '+key+'">'+button.label+'<span class="votes">'+button.value+'</span></div>');

                $button.on('click', function(){

                    var is_incremented = _localStorageIsIncremented($this.poll_id, key);

                    if(is_incremented) {
                        button.value--;
                    } else {
                        button.value++;
                    }

                    //storage values will be saved after callback executed.
                    //TODO: add check for question mark in URL!
                    _jsonp_request($this.options.save_url+$this.poll_id+'?button='+key+'&action='+(is_incremented ? 'dec' : 'inc'));

                });


                $button.appendTo($el);
            });

        }

    }


    document.rapidvote = {};


    // Create the jQuery plugin
    $.fn.rapidvote = function(options) {

        //merge defaults and options
        // options = $.extend(false, {}, defaults, options);
        options = $.extend(false, {}, defaults, options);

        return this.each(function() {
            var $this = $(this); //element

            var instance = new RapidVote($this, options);

            $this.data('rapidvote', instance);
            document.rapidvote[instance.poll_id]=instance;

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

        document.rapidvote[poll_id].get_buttons_data(data);
    };

    $.rapidvoteSetJSONpDataCallback = function(poll_id, data){

        if( typeof(poll_id) == undefined || poll_id == '' || typeof(data) == undefined || typeof(data.status) == undefined) {
            console.log('RapidVote: Wrong callback options for buttons data.');
            return;
        } else if(data.status == 0) {
            console.log('RapidVote Error: '+data.errors);
            return;
        }

        document.rapidvote[poll_id].set_buttons_data(data);
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