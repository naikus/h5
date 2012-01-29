/**
 * The event module. Provides methods to add, remove, delegate and fire events and othe convenicence
 * methods
 */
(function($) {
   var slice = $.slice,
      forEach = $.forEach,
      map = $.map,

      readyCalls = [],
      isTypeOf = $.isTypeOf,
      isReady = false,
      eventApi,
      eventStore,
      create = document.createEvent;
      
   function addListener(elem, type, handler, capture) {
      if(elem.addEventListener) {
         elem.addEventListener(type, handler, capture || false);
      }else if(elem.attachEvent) {
         elem.attachEvent("on" + type, handler);
      }
   }

   function removeListener(elem, type, handler, capture) {
      if(elem.removeEventListener) {
         elem.removeEventListener(type, handler, capture || false)
      }else if(elem.detachEvent) {
         elem.detachEvent("on" + type, handler);
      }
   }
   
   function createEvent(type, props) {
      var evt, data = props || {},
         prop,
         bubbles = data.bubbles === false ? false : true,
         cancelable = data.cancelable === false ? false : true;
         
      if(create) {
         evt = document.createEvent("Events");
      }else if(document.createEventObject) {
         evt = document.createEventObject();
      }
      
      if(isTypeOf(props, "Object")) {
         for(prop in data) {
            if(prop !== "bubbles" && prop !== "cancelable") {
               evt[prop] = data[prop];
            }
         }
      }else {
         evt.data = props;
      }
      
      if(evt.initEvent) {
         evt.initEvent(type, bubbles, cancelable);
      }
      return evt;      
   }
   
   function parse(evtType) {
      var arr = evtType.split(".");
      return {
         type: arr[0],
         ns: arr.slice(1).join(".")
      }
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
   
   eventStore = (function() {
      var handlers = {};
      
      function eid(elem) {
         return elem.__h5evtId || (elem.__h5evtId = "h5evt_" + $.uuid());
      }    
      
      function findHandler(arrH, type, listener, capture) {
         var handler, i, len, h;
         for(i = 0, len = arrH.length; i < len; i++) {
            h = arrH[i];
            if(h.listener === listener && h.capture === capture && h.type === type) {
               handler = h;
               break;
            }
         }
         return handler;
      } 
      
      return {
         createHandler: function(elem, type, listener, capture) {
            var id = eid(elem), elemH = handlers[id] || (handlers[id] = []), 
            handler = findHandler(elemH, type, listener, capture),
            hArgs = slice.call(arguments, 4) || [],
            hFunc;
                    
            if(handler) {
               return null;
            }
             
            hFunc = function(e) {
               hArgs.unshift(e);
               if(listener.apply(elem, hArgs) === false) {
                  e.stopPropagation();
                  e.preventDefault();
               }
            };
            hFunc.listener = listener;
            hFunc.type = type;
            hFunc.capture = capture || false;
            hFunc.elem = elem;
             
            elemH.push(hFunc);
            return hFunc;
         },
         
         deleteHandler: function(elem, type, listener, capture) {
            var id = eid(elem), elemH = handlers[id], i, len, h, handler;
            if(!elemH) {
               return null;
            }
            capture = capture || false;
            for(i = 0, len = elemH.length; i < len; i++) {
               h = elemH[i];
               if(h.listener === listener && h.capture === capture && h.type === type) {
                  handler = h;
                  break;
               }
            }
            if(i < len) {
               elemH.splice(i, 1);
            }
            return handler;
         },
         
         getAllHandlers: function() {
            var allH = [];
            forEach(handlers, function(arrH, eId) {
               allH = allH.concat(arrH);
            });
            return allH;
         }
      };
   })();
      
   eventApi = {
      on: function(type, callback, data) {
         var evt = parse(type), domEvt = evt.type;
         forEach(this.elements, function(elem) {
            var h = eventStore.createHandler(elem, type, callback, false, data);
            if(h) {
               addListener(elem, domEvt, h, false);
            }
         }); 
      },
      
      un: function(type, callback, capture) {
         var evt = parse(type), domEvt = evt.type;
         forEach(this.elements, function(elem) {
            var h = eventStore.deleteHandler(elem, type, callback, capture);
            if(h) {
               removeListener(elem, domEvt, h, capture);
            }
         });
      },
      
      capture: function(type, callback, data) {
         var evt = parse(type), domEvt = evt.type;
         forEach(this.elements, function(elem) {
            var h = eventStore.createHandler(elem, type, callback, true, data);
            if(h) {
               addListener(elem, domEvt, h, true);
            }
         }); 
      },
      
      dispatch: function(type, data) {
         return map(this.elements, function(elem) {
            var evt = createEvent(type, data);
            if(elem.dispatchEvent) {
               elem.dispatchEvent(evt);
            }else if(elem.fireEvent) {
               elem.fireEvent("on" + type, evt);
            }
         });
      }
   };
   
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
      
      if(attachEvent && !document.removeEventListener) {
         window.attachEvent("onunload", function() {
            forEach(eventStore.getAllHandlers(), function(h) {
               $(h.elem).un(h.type, h.listener, h.capture);
            });
         });
      }
   })();
   
   $.ready = function(callback) {
      if(isReady) {
         callback.call(window);         
      }else {
         readyCalls.push(callback);
      }
   };
   
   $.extension(eventApi);
})(h5);
