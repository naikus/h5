# h5
#### A mini, modular javascript library for building mobile (and small desktop) apps.


### Goals
-----
h5 aims to be a mini javascript library that can be used to build mobile and small desktop apps targetted towards latest browsers. Although h5 also provides extensions and a way to make it work with older browsers upto IE6.


### Features
-----
- The familiar '$', also available as 'h5' globally.
- A small core h5.js
- An 'extension' API to plug in new extensions to h5, via `$.extension(...)`.
- A way to plug-in a different selector engine. Uses document.querySelectorAll by default.
- An few basic extensions (dom, event, events-for-ie, xhr, touch support)


### Extensions
-----
Following extensions are currently provided:

-   _dom_   `dom.js` provides various methods with familier syntax to manipulate DOM.
- _event_ `event.js` and `event_ie.js` provide convenient API to manage events including defining new events.
-   _xhr_   `xhr.js` provides a nice little wrapper around XMLHttpRequest including additional methods as well as ajax events.
- _touch_ `touch.js` defines touch related events using event module's event definition mechanism to define tap, dbltap, taphold swipe, swipeleft and swiperight events for a touch enabled device.

### Extending h5
-----
h5 can be easily extended with new extensions using its extension API. The examples below show two ways of doing it.

```javascript
$.extension({
   hide: function() {
      this.get(0).style.display = "none";
      return this;
   },
   show: function() {
      this.get(0).style.display = "";
      return this;
   }
});

// now use it!
$("#loginPanel").show();

// another way is:
$.extension("zebra", function(options) {
   var opts = $.extend({}, {even: "even", odd: "odd"}, options);
   this.forEach(function(elem, i) {
      $(elem).addClass(i % 2 === 0 ? opts.even : opts.odd);
   });
   return this; // for chaining
});

// now use it!
$("table.data-table > tbody > tr").zebra({odd: "my-odd", even: "my-even"});
```

### Building
-----
h5 can be used as is including all the js files or can be built into a single js file h5.js. It requires ant to build. For a list of included modules included in each build target see build.xml file.

- To build h5 for newer browsers type `$>ant` at the console.
  This will generate h5.js (a combined file with code comments) and a h5.min.js file which is a minified file with various modules. 

- For older browsers type `$>ant build-legacy`. This builds modules required for older browsers.   Specifically the event module.
