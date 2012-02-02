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
      
   /**
    * Creates and initializes an event.
    * @param {String} type The type of the event e.g. mouseout, click, etc.
    * @param {Object} props The properties for the event. This can be an object that sets other properties
    * for this event or any string or any other object. If the props is an object, its properties are
    * assigned to the event object. If its a String or any other object, props is assigned to event.data
    * property.
    * @return the newly created and initialized (initEvent) event.    
    */
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
      var h = function() {
            document.removeEventListener("DOMContentLoaded", h, false);
            callReady();
      };
      document.addEventListener("DOMContentLoaded", h, false);
   })();
      
   eventApi = {
      /**
       * Adds an event listener, <tt>callback</tt> for the specified event on the current set of 
       * element(s). The capturing is set to false
       * @param {String} type The type of event "click", "mouseover", "mouseout", etc.
       * @param {Function} callback The callback function that will be called when the event is fired
       * on the current set of elements
       * @param {Object} data The extra information to be passed to callback when its called
       * @see $.capture(type, callback, data)
       */
      on: function(type, callback) {
         forEach(this.elements, function(elem) {
            elem.addEventListener(type, callback, false);
         });
      },
      
      /**
       * Removes the specified event listener from the current set to elements if they were previously
       * registered.
       * @param {String} type The type of event "click", "mouseover", "mouseout", etc.
       * @param {Function} callback The callback function that was added previously
       * @param {boolean} capture Whether the callback was registered for capturing or bubbling phase
       */
      un: function(type, callback, capture) {
         forEach(this.elements, function(elem) {
            elem.removeEventListener(type, callback, capture || false);
         });
      },
      
      /**
       * Adds an event listener, <tt>callback</tt> for the specified event on the current set of 
       * element(s). The capturing is set to true
       * @param {String} type The type of event "click", "mouseover", "mouseout", etc.
       * @param {Function} callback The callback function that will be called when the event is fired
       * on the current set of elements
       * @param {Object} data The extra information to be passed to callback when its called
       * @see $.on(type, callback, data)
       */
      capture: function(type, callback) {
         forEach(this.elements, function(elem) {
            elem.addEventListener(type, callback, true);
         });
      },
      
      /**
       * Dispatches the specified event on the current selected element(s)
       * @param {String} type The type of event "click", "mouseover", "mouseout", etc.
       * @param {Object} data The event data such as "button", "relatedTarget", etc for the event. If 
       * the data argument is not an object, its set into the property data.event
       */
      dispatch: function(type, data) {
         return map(this.elements, function(elem) {
            var evt = createEvent(type, data);
            elem.dispatchEvent(evt);
         });
      }
   };
   
   /**
    * The DOM ready function, This will be called as soon as possible when the DOM content of the
    * document is available.
    * @param callback {Function} The callback function to call as when DOM is ready.
    */
   $.ready = function(callback) {
      if(isReady) {
         callback.call(window);         
      }else {
         readyCalls.push(callback);
      }
   };
   
   $.extension(eventApi);
 })(h5);
