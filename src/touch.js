(function($) {
   var state, timer;
   if(!document.createTouch) {
      console.log("Your browser does not support touch on this device");
      return;
   }
   state = {};
   
   function movement(x1, y1, x2, y2) {
      var dx = x1 - x2, dy = y1 - y2; 
      return Math.abs(dx) > 30 || Math.abs(dy) > 30 ? {x: dx, y: dy} : null;
   }
   
   function direction(delta) {
      var x = delta.x, y = delta.y;
   }

   function ontouch(te) {
      var touch, now, elapsed, target = te.target, type = te.type, mov, tgt;
      switch(type) {
         case "touchstart":
            touch = te.touches[0];
            now = Date.now(); 
            elapsed = now - (state.last || now);
            
            if(elapsed > 0 && elapsed < 250 && state.target === target) {
               state.dbltap = true;
            }else {
               state.x = touch.screenX;
               state.y = touch.screenY;
               state.last = now;
               state.target = target;
               timer = setTimeout(function() {
                  if(state.moved) {
                     return;
                  }
                  state.taphold = true;
                  te.preventDefault();
                  $(target).dispatch("taphold");
               }, 750);
            }
            break;
         case "touchmove":
            touch = te.changedTouches[0];
            state.moved = movement(touch.screenX, touch.screenY, state.x, state.y);
            break;
         case "touchend":
            if(state.taphold) {
               delete state.taphold;
               return;
            }
            clearTimeout(timer);
            touch = te.changedTouches[0];
            mov = state.moved;
            tgt = $(target);
            if(mov) {
               tgt.dispatch("swipe");
               delete state.moved;
            }else {
               tgt.dispatch("tap");
               
               if(state.dbltap) {
                  delete state.last;
                  delete state.dbltap;
                  if(state.target === target) {
                     tgt.dispatch("dbltap");
                     return;
                  }
               }
            }
            break;
         case "touchcancel":
            clearTimeout(timer);
            break;
      }
   }
   
   $.defineEvent({
      setup: function() {
         $(document.body).on("touchstart", ontouch)
            .on("touchmove", ontouch)
            .on("touchend", ontouch)
            .on("touchcancel", ontouch);
      },
      destroy: function() {
         $(document.body).un("touchstart", ontouch)
            .un("touchmove", ontouch)
            .un("touchend", ontouch)
            .un("touchcancel", ontouch);
      }
   });
})(h5);
