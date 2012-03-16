/**
 * @fileOverview h5 is a compact and lightweight html5 library 
 * @author <a href="mailto:aniket3@gmail.com">Aniket Naik</a>
 */
(function(global) {
   "use strict";
   if(global.h5 && global.$) {
      return;
   }
   
   var undef,
      AProto = Array.prototype,
      OProto = Object.prototype,

      slice = AProto.slice,
      nSlice = slice,
      objToString = OProto.toString,

      doc = global.document, 
      huid = 1,
      h5;

   /* ------------------------------- Utility functions ---------------------------------------- */
    
   /**
    * Console logging API that just about works accross browsers. The log messages are ignored
    * if no logging feature is available in the browser
    */
   if(typeof global.console === "undefined") {
      global.console = (function() {
         var log = global.opera ? global.opera.postError : function() {};
         return {
            log: log
         };
      })();
   }
   
   /**
    * Creates a new object whose prototype is the specified object
    * @param {Object} objFrom The object to extend from
    */
   function createObject(objFrom) {
      if(Object.create) {
         return Object.create(objFrom);
      }
      function F() {}
      F.prototype = objFrom;
      return new F();
   }
   
   /**
    * Gets the type of object specified. The type returned is the [[Class]] internal property
    * of the specified object. For build in types the values are:
    * -----------------------------------------------------------
    * String  
    * Number  
    * Boolean 
    * Date    
    * Error   
    * Array   
    * Function
    * RegExp  
    * Object  
    *
    * @param {Object} that The object/function/any of which the type is to be determined
    */
   function getTypeOf(that) {
      // why 8? cause the result is always of pattern '[object <type>]'
      return objToString.call(that).slice(8, -1); 
   }
   
   function isTypeOf(that, type) {
      return objToString.call(that).slice(8, -1) === type;
   }
    
   function hasOwn(obj, prop) {
      if(obj.hasOwnProperty) {
         return obj.hasOwnProperty(prop);
      }else {
         var val = obj[prop];
         return typeof val !== "undefined" && obj.constructor.prototype[prop] !== val;
      }
   }
   
   function isFunction(that) {
      return objToString.call(that) === "[object Function]";
   }
   
   function isArray(that) {
      return objToString.call(that) === "[object Array]";
   }
   
   function sliceList(start, end)  {
      var arr, i, len = this.length, s = start || 0, e = end || len;
      if(isArray(this)) {
         arr = nSlice.call(this, s, e);
      }else {
         // so that we can have things like sliceList(1, -1);
         if(e < 0) { 
            e = len - e;
         }
         arr = [];
         for(i = s; i < e; i++) {
            arr[arr.length] = this[i];
         }
      }
      return arr;
   }
    
   function uuid() {
      return huid++;
   }
    
   // normalize the slice function
   (function() {
      try {
         slice.call(doc.getElementsByTagName("html")); // this fails below IE9
      }catch(err) {
         console.log("Array slice does not work on array-like objects, using custom slice");
         slice = sliceList;
      }
   })();
   
   /* ---------------------------- iteration functions ------------------------------------------ */
   
   /**
    * Iterates over the array (or arraylike or object) <tt>arr</tt> and calls the <tt>callback</tt>
    * for each iteration with the scope as <tt>thisObject</tt>. Uses the native forEach if its
    * available on the specified array or obejct.
    * @param {Object|Array} arr The array or object to iterate, if the object specified is an array
    * its elements are iterated, if the object is a "object" its values and keys are iterated
    * @param {Function} callback The callback function to call for each iteration. If an array is
    * iterated, the callback is called as <tt>callback(val, index, array)</tt> else the callback
    * is called as <tt>callback(value, key, obj)</tt>
    * @param {Object} thisObj An optional scope object that will be the value of "this" inside
    * the callback
    * @function
    */  
   function forEach(arr, callback, thisObj) {
      var o = Object(arr), each = arr.forEach, key;
      if(each && isFunction(each)) {
         arr.forEach(callback, thisObj);
      }else {
         for(key in o) {
            callback.call(thisObj, o[key], key, arr);
         }
      }
   }
    
   /**
    * Iterates over the array (or arraylike or object) <tt>arr</tt> and calls the <tt>callback</tt>
    * for each iteration with the scope as <tt>thisObject</tt> collecting or filtering objects for 
    * which the callback returns true. Uses the native <tt>Array.filter</tt> if its available on 
    * the specified array or obejct
    * @param {Object|Array} arr The array or object to iterate, if the object specified is an array
    * its elements are iterated, if the object is a "object" its values and keys are iterated
    * @param {Function} callback The callback function to call for each iteration. If an array is
    * iterated, the callback is called as <tt>callback(val, index, array)</tt> else the callback
    * is called as <tt>callback(value, key, obj)</tt>
    * @param {Object} thisObj An optional scope object that will be the value of "this" inside
    * the callback
    * @return An array of filtered objects
    * @function
    */
   function filter(arr, callback, thisObj) {
      var o = Object(arr), fil = arr.filter, ret;
      if(fil && isFunction(fil)) {
         return o.filter(callback, thisObj);
      }else {
         ret = [];
         forEach(arr, function(val, idx, arr) {
            if(callback.call(thisObj, val, idx, arr)) {
               ret[ret.length] = val;
            }
         });
         return ret;
      }
   }
   
   /**
    * Calls the <tt>callback</tt> function for each of the items in the array/obj <tt>arr</tt> and
    * returns the values returned by callback for each of these in an array
    */
   function map(arr, callback, thisObj) {
      var ret = [];
      forEach(arr, function(val, i, arr) {
         if(typeof val !== "undefined") {
            var retVal = callback.call(thisObj, val);
            if(retVal !== null && typeof retVal !== "undefined") {
               ret[ret.length] = retVal;
            }
         }
      });
      return ret;
   }
    
    
   /**
    * Extends the target object from multiple sources
    */
   function extend(/*target, source0, souce1, souce2, ... */) {
      var target = arguments[0], sources = slice.call(arguments, 1);
      forEach(sources, function(src) {
         for(var k in src) {
            target[k] = src[k];
         }
      });
      return target;
   }

    
   /* ------------------------------- The nodelist ---------------------------------------------- */
   h5 = (function() {
      var htmlRe = /^\s*<(\w+)[^>]*>/,
      isIe = !!window.ActiveXObject,
      table = doc.createElement("table"),
      tbody = doc.createElement("tbody"),
      tr = doc.createElement("tr"),
      div = doc.createElement("div"),

      hasqsa = !! doc.querySelectorAll,
      selEngine = global.selectorEngine,

      containers = {
         "*": div,
         // table: table,
         tbody: table,
         tfoot: table,
         tr: tbody,
         td: tr,
         th: tr
      },
            
      /**
       * The prototype for all our objects returned by $(...) or h5(...)
       */
      h5Proto;

      function fragments(html, tgName) {
         var c, ret, children, tag;
         if(!tgName) {
            ret = htmlRe.exec(html);
            tgName = ret ? ret[1] : null;
         }
         c = containers[tgName] || div;
         if(isIe) {
            tag = c.tagName.toLowerCase();
            if(tag === "tbody" || tag === "table" || tag === "thead") {
               return getFrags("table", html, true);
            }
         }
         c.innerHTML = "" + html;
         children = c.childNodes;
         return slice.call(children);
      }
        
      function elAndSel(s, c) {
         var ret = {
            e: [], 
            s: ""
         }, execRes, qr;
         if(!s) {
            return ret;
         }else if(isTypeOf(s, "String")) {
            if((execRes = htmlRe.exec(s)) !== null) {
               ret.e = fragments(s, execRes[1]);
            }else {
               if(hasqsa) {
                  qr = c.querySelectorAll(s);
               }else if(selEngine) {
                  qr =  selEngine(s, c);
               }else {
                  throw new Error("No selector engine found. Set custom engine via global selectorEngine property");
               }
               ret.e = slice.call(qr);
               ret.s = s;
            }
         }else if(s.elements) { // h5 object
            ret.e = s.elements;
            ret.s = s.selector;
         }else if(s.nodeName) { // dom element
            ret.e = [s];
         }else if(s.length) { // array or nodelist
            ret.e = slice.call(s);
         }else if(s === global) {
            ret.e = [s];
         }
         return ret;
      }
        
      function getFrags(nodeName, html, isTable) {
         var frags;
         html += "";
         div.innerHTML = ["<", nodeName, ">", html, "</", nodeName, ">"].join("");
         frags = isTable ? div.firstChild.firstChild.childNodes : div.firstChild.childNodes;
         return frags;
      }

      h5Proto = {
         /**
          * Gets the element at the specified index in this nodelist
          * @param {Number} idx The index of the element to get
          * @return {Node} The element or node at the specified index or null
          *
          * @memberOf nodelist
          */
         get: function(idx)   {
            return this.elements[idx];
         },
            
         count: function() {
            return this.elements.length;
         },
            
         /**
          * Finds the element(s) matching the specified selector within the context of the current
          * element (this can be null, then it works just like $(...))
          * @param {String} selector The selector of the elements to find
          * @return {Object} the $ object matched for chaining
          * @example
          * var pees = $("#foo").find("p"); // finds all the "p" elements under the element with id "foo"
          * // This finds the span element in element in the html and sets its content to stupid
          * $("&lt;p id="bar" class="foo baz"&gt;Hello &lt;span&gt;cruel&lt;/span&gt; world&lt;/p&gt;").find("span").html("stupid");
          * // Will result in 
          * &lt;p id="bar" class="foo baz"&gt;Hello &lt;span&gt;stupid&lt;/span&gt; world&lt;/p&gt;
          */
         find: function(selector)   { 
            var elements = this.elements;
            return elements.length === 0 ? nodelist(selector) : nodelist(selector, elements[0]);
         },
            
         /**
          * Calls the <tt>callback</tt> function for each element that is the part of this object
          * The callback is called as callback(each-element, index, element-array). The value of
          * this inside the callback function refers to the <tt>ctx</tt> argument or if not passed,
          * the global object
          * @param {Function} callback The callback function to call for each element
          * @param {Object} ctx The optional objec that becomes "this" inside the callback
          * @example
          * // Adds css class 'foo' to all the elements that also have 'para' css class and sets 
          * // their innerHTML to 'Bar'
          * $(".para").forEach(function(elem, i) {
          *   $(elem).addClass("foo").html("Bar");
          * });
          */
         forEach: function(callback, ctx) {
            forEach(this.elements.slice(0), callback, ctx || global);
            return this;
         },
            
         /**
          * Calls the <tt>callback</tt> function for each element that is the part of this object
          * and returns those objects as array for which the callback returns true.
          * The callback is called as callback(each-element, index, element-array). The value of
          * this inside the callback function refers to the <tt>ctx</tt> argument or if not passed,
          * the global object
          * @param {Function} callback The callback function to call for each element
          * @param {Object} ctx The optional objec that becomes "this" inside the callback
          * @example
          * // Gets all the elements with 'para' css class and returns an array of only those
          * // that have inner HTML as "Baz"
          * $(".para").forEach(function(elem, i) {
          *   return $(elem).html() === "Baz";
          * });
          */
         filter: function(callback, ctx) {
            return filter(this.elements.slice(0), callback, ctx || global);
         }
      };
        
      /**
       * This is the main entry point of h5. This can be called with a selector, h5 object,
       * DOM object(s) or array of object/dom nodes
       */
      function nodelist(sel, ctx) {
         ctx = ctx ? ctx.elements ? ctx.elements[0] : ctx : doc;
         var elemSel = elAndSel(sel, ctx), h5 = createObject(h5Proto);
         h5.elements = elemSel.e;
         h5.selector = elemSel.s;
         h5.context = ctx;
         return h5;
      }
        
      // Expose useful utility functions
      nodelist.forEach = forEach;
      nodelist.filter = filter;
      nodelist.map  = map;
      nodelist.isArray = isArray;
      nodelist.getTypeOf = getTypeOf;
      nodelist.isTypeOf = isTypeOf;
      nodelist.slice = function(arrayLike, start, end) {
         return slice.call(arrayLike, start, end);
      };
      nodelist.extend = extend;
      nodelist.getFragments = fragments;
      nodelist.uuid = uuid;
      nodelist.createObject = createObject;
        
      /**
       * Expose a extension API to extend 
       */
      nodelist.extension = function(/* [name, extFunc] | object */) {
         var extnObj = arguments[0], extFunc = arguments[1], name = extnObj, 
         arg1Type = getTypeOf(extnObj);      
            
         if(arg1Type === "String" && isFunction(extFunc)) {
            if(h5Proto[name]) {
               console.log("Warning! Extension " + name + " is already defined");
            }
            h5Proto[name] = extFunc;
         }else if(arg1Type === "Object") {
            forEach(extnObj, function(valFunc, key) {
               if(isFunction(valFunc)) {
                  nodelist.extension(key, valFunc);
               }
            });
         }else {
            console.log("Invalid extension definition");
         }
      };
        
      return nodelist;
   })();
    
   global.h5 = global.$ = h5;
    
})(this);



