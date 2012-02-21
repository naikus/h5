/**
 * Defines custom events for touch related gusters.
 * Following events are defined:
 * tap, dbltap, taphold, swipe, swipeleft, swiperight
 * @author anaik 
 */
(function($) {
   var state = {}, timer;
   
   /**
    * Calculate the delta difference between two points (x1,y1) and (x2,y2)
    * @return A delta object {x: xdelta, y: ydelta} if the difference is more
    * than 30 pixels or null if its less. The values x and y can be -ve 
    */
   function movement(x1, y1, x2, y2) {
      var dx = x1 - x2, dy = y1 - y2, xa, ya;
      if((xa = Math.abs(dx)) < 30 & (ya = Math.abs(dy)) < 30) {
         return null;
      }
      return {
         x: dx,
         y: dy,
         dir: xa >= ya ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down") 
      };
   }
   
   function ontouch(te) {
      var now, elapsed, touches = te.touches, cTouches = te.changedTouches, touch, target = te.target, 
         type = te.type, distance, tar;
      
      // bail out if we have more than one touches
      if(touches.length > 1 || cTouches.length > 1) {
         state = {};
         return;
      }
      
      switch(type) {
         case "touchstart":
            touch = touches[0];
            now = Date.now();
            elapsed = now - (state.last || now);
            if(elapsed > 0 && elapsed < 250 && state.target === target) {
               state.dbltap = true;
            }else {
               state.last = now;
               state.x = touch.screenX;
               state.y = touch.screenY;
               state.target = target;
               timer = setTimeout(function() {
                  if(state.moved) {
                     return;
                  }
                  state.wastaphold = true;
                  $(target).dispatch("taphold");
               }, 750);
            }
            break;
         case "touchmove":
            if(!state.last) {
               return;
            }
            touch = cTouches[0];
            state.distance = movement(touch.screenX, touch.screenY, state.x, state.y);
            if(state.distance) {
               state.moved = true;
            }
            break;
         case "touchend":
            clearTimeout(timer);
            touch = cTouches[0];
            // check if the taphold event fired
            if(state.wastaphold || !state.last) {
               state.wastaphold = false;
               return;
            }
            
            // check for swipe events
            distance = state.distance;
            tar = $(target);
            if(distance) {
               tar.dispatch("swipe").dispatch("swipe" + distance.dir);
               state.x = state.y = state.distance = state.moved = null;
            }else {
               tar.dispatch("tap");
               if(state.dbltap) {
                  state.last = state.dbltap = false;
                  if(state.target === target) {
                     tar.dispatch("dbltap");
                  }
               }
            }
            break;
         default:
            break;
      }
   }
      
   $.defineEvent({
      setup: function() {
         $(document).on("touchstart", ontouch)
            .on("touchmove", ontouch)
            .on("touchend", ontouch)
            .on("touchcancel", ontouch);
      },
      destroy: function() {
         $(document).un("touchstart", ontouch)
            .un("touchmove", ontouch)
            .un("touchend", ontouch)
            .un("touchcancel", ontouch);
      }
   });
})(h5);



