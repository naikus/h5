(function($) {
   /**
    * Add support touch related convenience events 
    */
   if(document.createTouch) {
      $.defineEvent(function() {
         var state = {}, timer;
         
         function hasMoved(x1, y1, x2, y2) {
            return Math.abs(x2 - x1) > 30 || Math.abs(y2 - y1) > 30;
         }
         
         $(document.body)
            .on("touchstart",  function(te) {
               var now = Date.now(), touch = te.touches[0], elapsed = now - (state.last || now), target = te.target;
               clearTimeout(timer);
               if(elapsed > 0 && elapsed < 250 && target === state.target) { // may be douple tap
                  state.dblTap = true;
               }else {
                  state = {};
                  state.x = touch.screenX;
                  state.y = touch.screenY;
                  state.last = now;
                  state.target = target;
                  timer = setTimeout(function() {
                     if(state.moved) {return;}
                     state.taphold = true;
                     te.preventDefault();
                     $(target).dispatch("taphold");
                  }, 700);
               }
            })
            .on("touchmove", function(te) {
               var touch = te.changedTouches[0];
               state.moved = state.moved || hasMoved(state.x, state.y, touch.screenX, touch.screenY);
               if(state.moved) {
                  clearTimeout(timer);
               }
            })
            .on("touchend", function(te) {
               var target = te.target;
               clearTimeout(timer);
               if(state.moved || state.taphold) {
                  state = {};
                  return;
               }
               if(state.dblTap) {
                  if(state.target === target) {
                     $(target).dispatch("dbltap");
                     state = {};
                  }else {
                     $(target).dispatch("tap");
                  }
               }else {
                  $(target).dispatch("tap");
               }
               te.preventDefault();
            })
            .on("touchenter", function(te) {})
            .on("touchleave", function(te) {})
            .on("touchcancel", function(te) {
               clearTimeout(timer);
            });
      });
   }else {
      console.log("Your browser does not support touch on this device");
   }
})(h5);



