/**
 * Defines custom events for touch related gusters.
 * Following events are defined:
 * tap, dbltap, taphold, swipe, swipeleft, swiperight
 * @author aniketn3@gmail.com 
 */
 
/**
 * Tap event definition
 */
(function($, undefn) {
   var state = {id: null, x: null, y: null, target: null }, undef = undefn;
   
   function clearState() {
      state.id = state.x = state.y = state.target = undef;
   }
   
   function hasMoved(x1, y1, x2, y2) {
      var dx = x1 - x2, dy = y1 - y2, xa, ya;
      return (xa = Math.abs(dx)) > 30 || (ya = Math.abs(dy)) > 30
   }
   
   function ontouch(te) {
      var type = te.type, touch, touches, cTouches, touchId, target = te.target;
      switch(type) {
         case "touchstart":
            touches = te.touches;
            if(touches.length !== 1) {
               return;
            }
            touch = touches[0];
            state.id = touch.identifier;
            state.x = touch.pageX;
            state.y = touch.pageY;
            state.target = target;
            break;
         case "touchend":
            cTouches = te.changedTouches;
            if(cTouches.length === 0) {
               clearState();
               return;
            }
            touch = cTouches[0];
            if(touch.identifier === state.id && 
                  !hasMoved(state.x, state.y, touch.pageX, touch.pageY) &&
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
         $(document).on("touchstart", ontouch)
            .on("touchend", ontouch)
            .on("touchcancel", ontouch);
      },
      destroy: function() {
         $(document).un("touchstart", ontouch)
            .un("touchend", ontouch)
            .un("touchcancel", ontouch);
      }
   });
})(h5);


/**
 * Double Tap event definition
 */
(function($) {
   var state = {};

   function ontap(te) {
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
         $(document).on("tap", ontap);
      },
      destroy: function() {
         $(document).un("tap", ontap);
      }
   });
})(h5);
