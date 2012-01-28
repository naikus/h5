/**
 * The event module. Provides methods to add, remove, delegate and fire events and othe convenicence
 * methods
 */
(function($) {
   var forEach = $.forEach,
      map = $.map,
      isTypeOf = $.isTypeOf,
      getTypeOf = $.getTypeOf,
      
      readyCalls = [],
      isReady = false,
      eventApi;
      
   $.ready = function(callback) {
      if(isReady) {
         callback.call(window);         
      }else {
         readyCalls.push(callback);
      }
   };
      
   function createEvent(type, props) {
      var evt, data = props || {},
         prop,
         bubbles = data.bubbles === false ? false : true,
         cancelable = data.cancelable === false ? false : true;   
      evt = document.createEvent("Events");

      if(isTypeOf(props, "Object")) {
         for(prop in data) {
            if(prop !== "bubbles" && prop !== "cancelable") {
               evt[prop] = data[prop];
            }
         }
      }else {
         evt.data = props;
      }      
      evt.initEvent(type, bubbles, cancelable);
      return evt;      
   }
   
   /**
    *
    * IEContentLoaded.js
    *
    * Author: Diego Perini (diego.perini@gmail.com) NWBOX S.r.l.
    * Summary: DOMContentLoaded emulation for IE browsers
    * Updated: 05/10/2007
    * License: GPL/CC
    * Version: TBD
    * 
    * @param {Window} w The wndow object
    * @param {Function} fn the callback function
    */
   function ieContentLoaded (w, fn) {
      var d = w.document, done = false,
      // only fire once
      init = function () {
         if (!done) {
            done = true;
            fn();
         }
      };
      // polling for no errors
      (function poll() {
         try {
            // throws errors until after ondocumentready
            d.documentElement.doScroll('left');
         } catch (e) {
            setTimeout(poll, 50);
            return;
         }
         // no errors, fire
         init();
      })();
      // trying to always fire before onload
      d.onreadystatechange = function() {
         if (d.readyState === 'complete') {
            d.onreadystatechange = null;
            init();
         }
      };
   }
   
   function callReady() {
      if(isReady) {
         return;
      }
      isReady = true;
      forEach(readyCalls, function(fun) {
         fun.call(window);
      });
      readyCalls = null;
   }
   
   (function init() {
      var h, attachEvent = document.attachEvent;
      if(document.addEventListener) {
         h = function() {
            document.removeEventListener("DOMContentLoaded", h, false);
            callReady();
         };
         document.addEventListener("DOMContentLoaded", h, false);
      }else if(attachEvent) {
         ieContentLoaded(window, callReady);
      }
   })();
      
   eventApi = {
      on: function(type, callback) {
         forEach(this.elements, function(elem) {
            elem.addEventListener(type, callback, false);
         });
      },
      
      un: function(type, callback, capture) {
         forEach(this.elements, function(elem) {
            elem.removeEventListener(type, callback, capture || false);
         });
      },
      
      capture: function(type, callback) {
         forEach(this.elements, function(elem) {
            elem.addEventListener(type, callback, true);
         });
      },
      
      dispatch: function(type, data) {
         return map(this.elements, function(elem) {
            var evt = createEvent(type, data);
            elem.dispatchEvent(evt);
         });
      }
   };
   $.extension(eventApi);
 })(h5);
