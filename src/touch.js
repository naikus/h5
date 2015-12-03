/**
 * Defines custom events for touch related gusters.
 * Following events are defined:
 * tap, dbltap, taphold, swipe, swipeleft, swiperight
 * @author aniketn3@gmail.com 
 */

/**
 * Tap event definition
 */
(function($, undefined) {
   var state = {/* id, x, y, target */};
   
   function clearState() {
      state.id = state.x = state.y = state.moved = state.target = undefined;
   }
   
   function hasMoved(x1, y1, x2, y2) {
      var dx = x1 - x2, dy = y1 - y2;
      return Math.abs(dx) > 15 || Math.abs(dy) > 15;
   }
   
   function handler(te) {
      var type = te.type, touch, touches = te.touches, cTouches = te.changedTouches, target = te.target;
      switch(type) {
         case "touchstart":
            if(touches.length !== 1) {
               return;
            }
            touch = touches[0];
            state.id = touch.identifier;
            state.x = touch.pageX;
            state.y = touch.pageY;
            state.target = target;
            break;
         case "touchmove":
            touch = cTouches[0];
            if(!state.moved && touch.identifier === state.id) {
               state.moved = hasMoved(state.x, state.y, touch.pageX, touch.pageY);
            }
            break;
         case "touchend":
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
         case "touchcancel":
            clearState();
            break;
      }
   }
      
   $.defineEvent({
      type: "tap",
      setup: function() {
         $(document).on("touchstart", handler).on("touchmove", handler)
            .on("touchend", handler).on("touchcancel", handler);
      },
      destroy: function() {
         $(document).un("touchstart", handler).un("touchmove", handler)
            .un("touchend", handler).un("touchcancel", handler);
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
      var state = {/* moved, x, y */}, timer;
   
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
         case "touchstart":
            if(te.touches.length !== 1) {
               return;
            }            
            state.x = te.pageX;
            state.y = te.pageY;
            timer = setTimeout(function() {
               if(!state.moved) {
                  $(target).dispatch("taphold");
               }
            }, 700);
            break;
         case "touchmove":
            if(!state.moved) {
               if(state.moved = hasMoved(state.x, state.y, te.pageX, te.pageY)) { // jshint ignore:line
                  clearTimeout(timer);
               }
            }
            break;
         case "touchend":
         case "touchcancel":
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
         $(document).on("touchstart", handler).on("touchmove", handler).on("touchend", handler)
            .on("touchcancel", handler);
      },
      destroy: function() {
         $(document).un("touchstart", handler).un("touchmove", handler).un("touchend", handler)
            .un("touchcancel", handler);
      }
   });
})(h5);


/**
 * Swipe event
 */
(function($, undefined) {
   var state = {};
   
   /**
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
         case "touchstart":
            touches = te.touches;
            if(touches.length > 1) {
               return;
            }
            touch = touches[0];
            state.id = touch.identifier;
            state.x = touch.pageX;
            state.y = touch.pageY;
            break;
         case "touchmove":
            touches = te.changedTouches;
            touch = touches[0];
            if(touch.identifier === state.id && te.touches.length === 1) {
               state.movement = getMovement(touch.pageX, touch.pageY, state.x, state.y);
            }
            break;
         case "touchend":
            touches = te.changedTouches;
            touch = touches[0];
            if(state.id === touch.identifier && (m = state.movement)) {
               evtData = m;
               $(te.target).dispatch("swipe", evtData); // available as event.data
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
         $(document).on("touchstart", handler).on("touchmove", handler).on("touchend", handler)
            .on("touchcancel", handler);
      },
      destroy: function() {
         $(document).un("touchstart", handler).un("touchmove", handler).un("touchend", handler)
            .un("touchcancel", handler);
      }
   });
})(h5);



