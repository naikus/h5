/**
 * The event module. Provides methods to add, remove, delegate and fire events and othe convenicence
 * methods
 * @author aniketn3@gmail.com
 */
(function($) {
   var forEach = $.forEach,
      isTypeOf = $.isTypeOf,
      
      noop = function() {}, customEvents = {}, 
      defaultDefn = {
         setup: noop,
         destroy: noop,
         defaultAction: noop
      },
      
      readyCalls = [],
      isReady = false;
      
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
   
   function setupCustomEvent(type, elems) {
      var eData = customEvents[type], defn, count;
      if(!eData) {return;}
      
      count = eData.count;
      if(!count) { // setup this custom event
         defn = eData.definition;
         defn.setup();
      }
      eData.count += elems.length;
   }
   
   function destroyCustomEvent(type, elems) {
      var eData = customEvents[type], defn, count;
      if(!eData || !eData.count) {return;}
      
      eData.count -= elems.length;
      if(!eData.count) {
         defn = eData.definition;
         defn.destroy();
      }
   }
   
   (function init() {
      var h = function() {
            document.removeEventListener("DOMContentLoaded", h, false);
            callReady();
      };
      if(document.addEventListener) {
         document.addEventListener("DOMContentLoaded", h, false);
      }
   })();
      
   $.extension({
      /**
       * Adds an event listener, <tt>callback</tt> for the specified event on the current set of 
       * element(s). The capturing is set to false
       * @param {String} type The type of event "click", "mouseover", "mouseout", etc.
       * @param {Function} callback The callback function that will be called when the event is fired
       * on the current set of elements
       * @see $.capture(type, callback)
       */
      on: function(type, callback) {
         var elems = this.elements;
         setupCustomEvent(type, elems);
         
         forEach(elems, function(elem) {
            elem.addEventListener(type, callback, false);
         });
         return this;
      },
      
      /**
       * Removes the specified event listener from the current set to elements if they were previously
       * registered.
       * @param {String} type The type of event "click", "mouseover", "mouseout", etc.
       * @param {Function} callback The callback function that was added previously
       * @param {boolean} capture Whether the callback was registered for capturing or bubbling phase
       */
      un: function(type, callback, capture) {
         var elems = this.elements;
         destroyCustomEvent(type, elems);
         forEach(elems, function(elem) {
            elem.removeEventListener(type, callback, capture || false);
         });
         return this;
      },
      
      /**
       * Adds an event listener, <tt>callback</tt> for the specified event on the current set of 
       * element(s). The capturing is set to true
       * @param {String} type The type of event "click", "mouseover", "mouseout", etc.
       * @param {Function} callback The callback function that will be called when the event is fired
       * on the current set of elements
       * @see $.on(type, callback)
       */
      capture: function(type, callback) {
         var elems = this.elements;
         setupCustomEvent(type, elems);
         forEach(elems, function(elem) {
            elem.addEventListener(type, callback, true);
         });
         return this;
      },
      
      /**
       * Dispatches the specified event on the current selected element(s)
       * @param {String} type The type of event "click", "mouseover", "mouseout", etc.
       * @param {Object} data The event data such as "button", "relatedTarget", etc for the event. If 
       * the data argument is not an object, its set into the property data.event
       */
      dispatch: function(type, data) {
         forEach(this.elements, function(elem) {
            var evt = createEvent(type, data);
            return elem.dispatchEvent(evt);
         });
         return this;
      }
   });
   
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

   /**
    * Defines a custom event. The definition is specified by the definition object described below
    * @param definition The definition object for this custom event. This object has following
    * properties and methods:
    *
    * type: The custom event that is being defined. This is optional if you are defining multiple events at a time.
    * 
    * setup: Function to call when you want to set up your custom handling mechanism. This is called only once. If
    * the 'type' property is defined, this function is called when the first event listener for this event is added
    * to an element. If the 'type' property is not defined. The setup function is called when DOM content becomes 
    * available, specifically in $.ready().
    *
    * destroy: Function to cleanup the custom event. This is also called only once. If the 'type' property is
    * defined, its called when the last event listener is removed for this custom event, and if the 'type' is not
    * defined, its called on unload of the document    
    * 
    * @example
    * <pre>
    * $.defineEvent({
    *    type: "bigbang",        // The custom event type you are defining. 
    *    setup: function() {     // The code to setup event
    *       
    *    }, 
    *    destroy: function() {   // The code to cleanup
    *    
    *    }  
    * });  
    * </pre>
    * 
    * @see See touch.js for a concrete example
    */
   $.defineEvent = function(definition) {
      var eData, defn, type;
      
      type = definition.type;
      if(!type) { // this is unmanaged eager definition, probably defining multiple custom events
         $.ready(function() {
            definition.setup();
         });
         $(document).on("unload", function() {
            definition.destroy();
         });
         return;
      }
      eData = customEvents[type];
      if(eData) {
         defn = eData.definition;
         defn.destroy();
         console.log("Event " + type + " is already defined, overwriting!");
      }else {
         customEvents[type] = {
            type: type,
            count: 0,
            definition: $.shallowCopy({}, defaultDefn, definition)
         };
      }
   };
})(h5);



