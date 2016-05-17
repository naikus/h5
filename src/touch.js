/**
 * Defines custom events for touch related gusters.
 * Following events are defined:
 * tap, dbltap, taphold, swipe, swipeleft, swiperight
 * @author aniketn3@gmail.com 
 */

(function($, undefined) {
  // set the default user action event (tap in touch enabled browsers or fallback to click
  var Events = {
    tap: "tap",
    taphold: "taphold",
    dbltap: "dbltap",
    touchstart: "touchstart",
    touchend: "touchend",
    touchmove: "touchmove",
    touchcancel: "touchcancel"
  };
  
  if(!("ontouchstart" in document.documentElement)) {
    Events = {
      tap: "click",
      taphold: "mousedown",
      dbltap: "dblcick",
      touchstart: "mousedown",
      touchend: "mouseup",
      touchmove: "mousemove",
      touchcancel: "touchcancel"
    };
  }
  
  $.EventTypes = Events;
  console.log($.EventTypes);
  
})(h5);

/**
 * Tap event definition
 */
(function($, undefined) {
   var state = {/* id, x, y, target */}, EventTypes = $.EventTypes;
   
   function clearState() {
      if(arguments.length) {
        console.log("Clearing state because of event " + arguments[0].type);
      }
      state.id = state.x = state.y = state.moved = state.target = undefined;
   }
   
   function hasMoved(x1, y1, x2, y2) {
      var dx = x1 - x2, dy = y1 - y2;
      return Math.abs(dx) > 15 || Math.abs(dy) > 15;
   }
   
   function handler(te) {
      var type = te.type, touch, touches = te.touches, cTouches = te.changedTouches, 
          target = te.target;
      switch(type) {
         case EventTypes.touchstart:
            if(touches.length !== 1) {
               return;
            }
            touch = touches[0];
            state.id = touch.identifier;
            state.x = touch.pageX;
            state.y = touch.pageY;
            state.target = target;
            break;
         case EventTypes.touchmove:
            touch = cTouches[0];
            if(!state.moved && touch.identifier === state.id) {
               state.moved = hasMoved(state.x, state.y, touch.pageX, touch.pageY);
            }
            break;
         case EventTypes.touchend:
            if(cTouches.length === 0 || state.moved) {
               clearState();
               return;
            }
            touch = cTouches[0];
            if(touch.identifier === state.id && !state.moved &&
                  // !hasMoved(state.x, state.y, touch.pageX, touch.pageY) &&
                  state.target === target) {
               $(target).dispatch("tap");
            }
            break;
         case EventTypes.touchcancel:
            clearState();
            break;
      }
   }
      
   $.defineEvent({
      type: "tap",
      setup: function() {
         $(document).on(EventTypes.touchstart, handler).on(EventTypes.touchmove, handler)
            .on(EventTypes.touchend, handler).on(EventTypes.touchcancel, handler)
            .on("_tapcancel", clearState);
      },
      destroy: function() {
         $(document).un(EventTypes.touchstart, handler).un(EventTypes.touchmove, handler)
            .un(EventTypes.touchend, handler).un(EventTypes.touchcancel, handler)
            .un("_tapcancel", clearState);
      }
   });
})(h5);


/**
 * Double Tap event definition
 */
(function($, undefined) {
   var state = {/* last, target */};

   function handler(te) {
      var now = Date.now(), elapsed = now - (state.last || now), target = te.target;
      if(elapsed > 0 && elapsed < 300 && state.target === target) {
         $(target).dispatch("dbltap");
         state.last = state.target = null;
      }else {
         state.last = now;
         state.target = te.target;
      }
   }
      
   $.defineEvent({
      type: "dbltap",
      setup: function() {
         $(document).on("tap", handler);
      },
      destroy: function() {
         $(document).un("tap", handler);
      }
   });
})(h5);


/**
 * Tap hold event
 */
(function($, undefined) {
      var state = {/* moved, x, y */}, timer, EventTypes = $.EventTypes;
   
   function hasMoved(x1, y1, x2, y2) {
      var dx = x1 - x2, dy = y1 - y2;
      return Math.abs(dx) > 20 || Math.abs(dy) > 20;
   }
   
   function clearState() {
      state.moved = state.x = state.y = undefined;
   }
   
   function handler(te) {
      var type = te.type, target = te.target;
      switch(type) {
         case EventTypes.touchstart:
            if(te.touches.length !== 1) {
               return;
            }
            state.x = te.pageX;
            state.y = te.pageY;
            timer = setTimeout(function() {
               if(!state.moved) {
                  $(document).dispatch("_tapcancel");
                  $(target).dispatch("taphold");
               }
            }, 700);
            break;
         case EventTypes.touchmove:
            if(!state.moved) {
               if(state.moved = hasMoved(state.x, state.y, te.pageX, te.pageY)) { // jshint ignore:line
                  clearTimeout(timer);
               }
            }
            break;
         case EventTypes.touchend:
         case EventTypes.touchcancel:
            /* falls through */
         default:
            clearTimeout(timer);
            clearState();
            break;
      }
   }
   
   $.defineEvent({
      type: "taphold",
      setup: function() {
         $(document).on(EventTypes.touchstart, handler).on(EventTypes.touchmove, handler)
            .on(EventTypes.touchend, handler)
            .on(EventTypes.touchcancel, handler);
      },
      destroy: function() {
         $(document).un(EventTypes.touchstart, handler).un(EventTypes.touchmove, handler)
            .un(EventTypes.touchend, handler)
            .un(EventTypes.touchcancel, handler);
      }
   });
})(h5);


/**
 * Swipe event
 */
(function($, undefined) {
   var state = {}, EventTypes = $.EventTypes;
   
   /*
    * Calculate the delta difference between two points (x1,y1) and (x2,y2)
    * @return A delta object {x: xdelta, y: ydelta} if the difference is more
    * than 30 pixels or null if its less. The values x and y can be -ve 
    */
   function getMovement(x1, y1, x2, y2) {
      var dx = x1 - x2, dy = y1 - y2, xa, ya;
      if((xa = Math.abs(dx)) < 30 & (ya = Math.abs(dy)) < 30) {
         return null;
      }
      return {
         startX: x2,
         startY: y2,
         endX: x1,
         endY: y1,
         dir: xa >= ya ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down") 
      };
   }
   
   function clearState() {
      state.id = state.x = state.y = state.movement = undefined;
   }
   
   function handler(te) {
      var type = te.type, touches = te.touches, touch, target, m, evtData;
      
      switch(type) {
         case EventTypes.touchstart:
            touches = te.touches;
            if(touches.length > 1) {
               return;
            }
            touch = touches[0];
            state.id = touch.identifier;
            state.x = touch.pageX;
            state.y = touch.pageY;
            break;
         case EventTypes.touchmove:
            touches = te.changedTouches;
            touch = touches[0];
            if(touch.identifier === state.id && te.touches.length === 1) {
               state.movement = getMovement(touch.pageX, touch.pageY, state.x, state.y);
            }
            break;
         case EventTypes.touchend:
            touches = te.changedTouches;
            touch = touches[0];
            if(state.id === touch.identifier && (m = state.movement)) {
               evtData = m;
               $(te.target).dispatch("swipe", evtData); // available as event.movement
               clearState();
            }
            break;
         default:
            clearState();
            break;
      }
   }
   
   $.defineEvent({
      type: "swipe",
      setup: function() {
         $(document).on(EventTypes.touchstart, handler).on(EventTypes.touchmove, handler)
            .on(EventTypes.touchend, handler)
            .on(EventTypes.touchcancel, handler);
      },
      destroy: function() {
         $(document).un(EventTypes.touchstart, handler).un(EventTypes.touchmove, handler)
            .un(EventTypes.touchend, handler)
            .un(EventTypes.touchcancel, handler);
      }
   });
})(h5);



