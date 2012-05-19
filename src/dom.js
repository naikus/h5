/**
 * The DOM manipulation module. This provides various convenience methods for working with DOM and
 * css
 * @author aniketn3@gmail.com
 */
(function($) {
   var undef,
      gcs = window.getComputedStyle,
      fragments = $.getFragments,
      slice = $.slice,
      forEach = $.forEach,
      isTypeOf = $.isTypeOf,
      isArray = $.isArray,
      getTypeOf = $.getTypeOf,
      trim = $.trim,
      splAttrs = { // thanks jquery :-)
         tabindex: "tabIndex",
         readonly: "readOnly",
         "for": "htmlFor",
         "class": "className",
         maxlength: "maxLength",
         cellspacing: "cellSpacing",
         cellpadding: "cellPadding",
         rowspan: "rowSpan",
         colspan: "colSpan",
         usemap: "useMap",
         frameborder: "frameBorder",
         contenteditable: "contentEditable"
      },
      clsRegExps = {};
     
   /**
    * Removes all the children of the specified element using DOM APIs
    * This is used as a fallback method instead of setting innerHTML as "" as this fails in
    * some versions of IE browsers
    */
   function removeAllDom(elem) {
      // In a few cases in IE, the innerHTML of a table is a read only property
      // thats why we have to use dom 
      var child = elem.firstChild;
      while(child)   {
         elem.removeChild(child);
         child = elem.firstChild;
      }
      return elem;
   }
   
   function removeAll(elem, useDom)   {
      if(useDom) {
         return removeAllDom(elem);
      }
      try {
         elem.innerHTML = "";
      }catch(e) {
         return removeAllDom(elem);
      }
      return elem;
   }
     
   function isNodeList(that) {
      if(!that) {
         return false;
      }
      var thatType = getTypeOf(that);
      return thatType === "NodeList" || thatType === "HTMLCollection" || (that.item && (that.length !== undef));
   }
   
   function classRe(clazz) {
      // new RegExp("\\b" + clazz + "[^\w-]")
      return clsRegExps[clazz] || (clsRegExps[clazz] = 
            new RegExp("(^|\\s+)" + clazz + "(?:\\s+|$)")); // thank you xui.js :) 
   }
     
   /**
    * Converts the <tt>html</tt> which can be an HTML string, a nodelist or a node, then passes the
    * converted html and the specified <tt>element</tt> to the callback as:
    * <tt>callback(element, arrnodesFromhtml)</tt>.
    * The idea is borrowed from turing.js framework (https://github.com/alexyoung/turing.js) but with
    * some modifications. If the element is a table element, then the callback is passed a tbody, if
    * present or the table element
    */
   function domify(element, html, callback)  {
      var nodeName = element.nodeName.toLowerCase(), htmType = getTypeOf(html),
      isTable = (nodeName === "table" || nodeName === "tbody"), cbElem, frags;
      
      if(htmType === "String" || htmType === "Number") {
         frags = fragments(html);
      }else if(html.nodeName) { // dom node
         frags = [html];
      }else if(html.elements) { // h5 object
         frags = html.elements;
      }else if(isArray(html) || isNodeList(html)) { // array or nodelist
         frags = html;
      }else {
         frags = fragments(html);
      }
         
      // if its table, pass in the tbody, else pass in the element
      cbElem = isTable ? (element.getElementsByTagName("tbody")[0] || element) : element;      
      callback(cbElem, slice(frags));
   }
   
   function append(elem, html) {
      domify(elem, html, function(appendTo, arrNodes) {
         forEach(arrNodes, function(node) {
            appendTo.appendChild(node);
         });
      });
   }
   
   function insertBefore(elem, html) {
      domify(elem, html, function(theElem, arrNodes) {
         var node, i, parent = elem.parentNode;
         // while inserting before, go backwards to maintain order :)
         for(i = arrNodes.length - 1; i >= 0; i--) {
            node = arrNodes[i];
            parent.insertBefore(node, theElem);
         }
      });
   }
   
   function prepend(elem, html) {
      domify(elem, html, function(theElem, arrNodes) {
         var child, node, i;
         // while prepending, go backwards to maintain order :)
         for(i = arrNodes.length - 1; i >= 0; i--) {
            child = theElem.firstChild;
            node = arrNodes[i];
            if(child)  { 
               theElem.insertBefore(node, child);
            }else {
               theElem.appendChild(node);
            }
         }
      });
   }
   
   function replace(elem, html) {
      domify(elem, html, function(appendTo, arrNodes) {
         appendTo = removeAll(appendTo);
         append(appendTo, arrNodes);
      });
   }
   
   function hasClass(elem, clName) {
      return classRe(clName).test(elem.className);
   }
   
   function addClass(elem, clName) {
      var cList = elem.classList;
      if(!cList || !clName) {
         return false;
      }
      cList.add(clName);
      return true;
   }
   
   function removeClass(elem, clName) {
      var cList = elem.classList;
      if(!cList || !clName) {
         return false;
      }
      cList.remove(clName);
      return true;
   }
   
   function data(elem, prop, val) {
      var arglen = arguments.length, dmap = elem.datamap || (elem.datamap = {});
      if(arglen === 1)  {
         return dmap;
      }else if(arglen === 2) {
         return dmap[prop];
      }else {
         //dmap = elem.datamap = elem.datamap || {};
         dmap[prop] = val;
         return null;
      }
   }
   
   function getStyle(elem, prop)   {
      var cs;
      if(gcs)  {
         cs = gcs(elem, null);
      }else {
         cs = elem.currentStyle;
      }
      return cs[prop];
   }
   
   function getBoundingBox(elem) {
      // cool! https://developer.mozilla.org/en/DOM/element.getBoundingClientRect
      if(elem.getBoundingClientRect) { 
         return elem.getBoundingClientRect();
      }
      return getOffsets(elem);
   }
   
   function getOffsets(elem)  {
      var o = {
         top: elem.offsetTop,
         right: 0,
         bottom: 0,
         left: elem.offsetLeft,
         width: elem.offsetWidth,
         height: elem.offsetHeight
      },
      par = elem.offsetParent;

      while(par)  {
         o.left += par.offsetLeft;
         o.top += par.offsetTop;
         par = par.offsetParent;
      }
      return o;
   }
   
   function setAttributes(elem, attrs) {
      forEach(attrs, function(val, key) {
         var spl = splAttrs[key], n = spl || key;
         if(spl) {
            elem[n] = val; // @TODO: should this be $(elem).val(val) in case of n === "value"?
         }else {
            elem.setAttribute(key, val);
         }
      });
   }
     
   $.extension({
      /*
      clone: function(bDeep) {
         var clArr = [];
         bDeep = typeof bDeep === "undefined" ? false : !!bDeep;
         forEach(this.elements, function(elem, i) {
            clArr[i] = elem.cloneNode(bDeep);
         });
         return nodelist(clArr);
      },
      */
         
      /**
       * Gets or sets the html string as inner html to all the elements in the current matched 
       * elements. If call without arguments, returns the html contents of the first element in
       * current matched elements.
       * @param {String} markup The html to set (Optional)
       * @return {String} The html contents of the matched element if called without any arguments
       * or the nodelist objec for chaining
       *
       * @memberOf nodelist
       */
      html: function(markup)  {
         var elements = this.elements, ret, isStr;
         if(arguments.length === 0) {
            ret = [];
            forEach(elements, function(el) {
               ret[ret.length] = el.innerHTML;
            });
            return ret.join("");
         }
         markup = typeof markup === "undefined" || markup === null ?  "" : markup;
         isStr = isTypeOf(markup, "String");
         forEach(elements, function(elem) {
            if(isStr) {
               try {
                  elem.innerHTML = markup;
               }catch(e)   {
                  replace(elem, markup);
               }
            }else {
               replace(elem, markup);
            }
         });
         return this;
      },
         
      /**
       * Gets or sets an attribute of the matched element(s). If <tt>value</tt> is specified, 
       * the attribute is set with that value, else the value of the attribute is returned
       * @param {String} name The attribute name
       * @param {String} value The value to set
       * @return {String} the value of the attribute if called with <tt>name</tt> else the nodelist
       * for chaining
       *
       * @memberOf nodelist
       */
      attr: function(name, value) {
         var spl = splAttrs[name], n = spl || name, elements = this.elements, ntype = typeof name; 
         if(!elements.length)  {
            return value ? this : null;
         }

         if(arguments.length === 1) {
            if(ntype === "string") {
               if(spl) {
                  return elements[0][n];
               }
               return elements[0].getAttribute(name);
            }else {
               forEach(elements, function(e) {
                  setAttributes(e, n);
               });
               return this;
            }
         }else {
            if(spl) {
               forEach(elements, function(e) {
                  e[n] = value;
               });
            }else {
               forEach(elements, function(e) {
                  e.setAttribute(name, value);
               });
            }
            return this;
         }
      },
         
      /**
       * Gets or sets the value of a form element (the "value" attribute). If called with 1 argument,
       * the value is set or else the value is retrieved
       * @param {String} theVal The value to set
       * @return {String} The value of the input or form field if called without any arguments else 
       * the nodelist object for chaining
       *
       * @memberOf nodelist
       */             
      val: function(theVal)   {
         var n, opts, vals, opv, el, ret, elements = this.elements, rlen;
         if(!elements.length) {
            return theVal ? this : null;
         }

         if(arguments.length === 1) {
            forEach(elements, function(elem) {
               n = elem.nodeName.toLowerCase();
               if(n === "select") {
                  opts = $("option", elem).elements;
                  vals = isTypeOf(theVal, "Array") ? theVal : [theVal];
                         
                  elem.selectedIndex = -1;
                         
                  forEach(vals, function(val) {
                     try {
                        forEach(opts, function(opt, index) {
                           opv = opt.value || opt.innerHTML;
                           if(opv === val) {
                              opt.selected = "selected";
                              // elem.selectedIndex = index;
                              // elem.value = val;
                              throw "Break";
                           }
                           return null;
                        });
                     }catch(breakExp) {}
                  });
               }else {
                  elem.value = theVal;
               }
            });
            return this;
         }else {
            el = elements[0];
            n = el.nodeName.toLowerCase();
            if(n === "select") {
               ret = [];
               opts = $("option", el).elements;
               forEach(opts, function(opt) {
                  if(opt.selected) {
                     opv = opt.value || opt.innerHTML;
                     ret[ret.length] = opv;
                  }
               });
                     
               rlen = ret.length;
               return rlen === 0 ? "" : rlen === 1 ? ret[0] : ret;
            }else {
               return el.value;
            }
         }
      },

      /**
       * Gets or sets the custom data on matched element(s). Uses HTML5 datasets if available
       * @param {String} name The name of data property
       * @param {Object} value The value of the property
       * @return {Object} The value of the property if called with ony 1 argument else the nodelist
       * object for chaining
       *
       * @memberOf nodelist
       */
      data: function(name, value)   { 
         var len = arguments.length, elements = this.elements;
         if(elements.length === 0)  {
            return null;
         }
         
         if(len === 1)  {
            return data(elements[0], name);
         }else {
            forEach(elements, function(elem) {
               data(elem, name, value);
            });
         }
         return this;
      },
         
      /**
       * Appends the html content (node, or html string) to the first matched element.
       * @param {String|Node} html The html content to append
       * @return {Object} the same nodelist for chaining
       */
      append: function(html)  {
         var elements = this.elements;
         if(!html || !elements.length) {
            return this;
         }
         append(elements[0], html);
         return this;
      },
         
      /**
       * Prepends the html to the first matched element in this context (nodelist)
       * @param {String|Node} html The html content to prepend (insertbefore)
       * @return {Object} the nodelist object for chaining
       */
      prepend: function(html) {
         var elements = this.elements;
         if(!html || !elements.length) {
            return this;
         }
         prepend(elements[0], html);            
         return this;
      },
      
      before: function(html) {
         var elems = this.elements;
         if(!html || !elems.length) {
            return this;
         }
         insertBefore(elems[0], html);
         return this;
      },
         
      /**
       * Removes all the elements matching the selector from this context (nodelist)
       * @param {String|Node|HTML|NodeList|ArrayOfNodes} selector The CSS selector for the element(s) 
       * to match
       * @example
       * // Given element 
       * &lt;p id="bar" class="foo baz"&gt;Hello &lt;span&gt;stupid&lt;/span&gt; world&lt;/p&gt;
       * $("#bar").remove("span");
       * // will result in
       * &lt;p id="bar" class="foo baz"&gt;Hello world&lt;/p&gt;
       */
      remove: function(/* sel */) {
         var sel, elems = this.elements;
         if(!arguments.length) {
            forEach(elems, function(e) {
               var p = e.parentNode;
               p.removeChild(e);
            });
            this.elements = [];
         }else if(elems.length) {
            sel = arguments[0];
            forEach(elems, function(e) {
               forEach($(sel, e), function(re) {
                  var n = re.parentNode;
                  return n ? n.removeChild(re) : null;
               });
            });
         }
         return this;
      },
         
      /**
       * Determines whether the current matched element has the specified class in its className
       * @param {String} cl The class name to check
       * @return true if the current element has the specified class
       * @example
       * // given element
       * &lt;p id="mypara" class="para info"&gt;Hello&lt;/p&gt;
       * // this returns true
       * $("#mypara").hasClass(info); // true
       */
      hasClass: function(cl) {
         var elems = this.elements;
         return elems.length && hasClass(elems[0], cl);
      },
         
      /**
       * Adds a CSS class <tt>cl</tt> to the current matched element
       * @param {String} cl The class to add
       * @return {Object} The nodelist object for chaining
       * @example
       * // Given the element
       * &lt;p id="mypara" class="foo baz"&gt;Hello&lt;/p&gt;
       * $("#mypara").addClass("bar") 
       * // will result in 
       * &lt;p id="mypara" class="foo baz bar"&gt;Hello&lt;/p&gt;
       */
      addClass: function(cl)  {
         var elements = this.elements;
         forEach(elements, function(el) {
            if(!hasClass(el, cl) && !addClass(el, cl)) {
               el.className += " " + cl;
            }
         });
         return this;
      },
         
      /**
       * Removes a class <tt>cl</tt> from the current matched element's className
       * @param {String} cl The class to remove
       * @return {Object} The nodelist object for chaining
       * @example
       * // Given the element
       * &lt;p id="mypara" class="foo bar baz"&gt;Hello&lt;/p&gt;
       * $("#mypara").removeClass("bar") 
       * // will result in 
       * &lt;p id="mypara" class="foo baz"&gt;Hello&lt;/p&gt;
       */
      removeClass: function(cl)  {
         forEach(this.elements, function(el) {
            var cName;
            if(hasClass(el, cl) && !removeClass(el, cl)) {
               el.className = trim(el.className.replace(classRe(cl), "$1"));
            }        
         });
         return this;
      },
         
      /**
       * Gets the value of the current or computed style property <tt>prop</tt> of the currently 
       * matched element
       * @param {String} prop The style property whose value is desired
       * @return {String} the value of the specified property or blank string
       * @example 
       * // Gets the background-color property of the element with id "foo"
       * var bgcolor = $("#foo").getStyle("backgroundColor");
       */
      getStyle: function(prop)   {
         var elements = this.elements;
         return elements.length === 0 ? "" : getStyle(elements[0], prop);
      },
         
      /**
       * Sets the css style properties <tt>props</tt> for all the matched elements
       * @param {Object} props The style properties to set
       * @return {Object} the nodelist object chaining
       * @example
       * // This will set the border and background-color style properties all input elements
       * $("input").setStyle({
       *    "backgroundColor": "#666", // note the css property is a javascript version
       *    "border": "1px solid #333"
       * });
       */
      setStyle: function(props, value)  {
         var type = getTypeOf(props);
         forEach(this.elements, function(elem) {
            var style = elem.style;
            if(props === "Object") {
               forEach(props, function(val, key) {
                  style[key] = val;
               });
            }else if(props === "String") {
               style[props] = value || "";
            }
         });
         return this;
      },
      
      css: function(prop, val) {
         var style;
         if(getTypeOf(prop) === "Object") {
            style = [];
            forEach(prop, function(v, k) {
               style[style.length] = k + ":" + v;
            });
            style = style.join(";");
         }else {
            style = prop + ":" + val;
         }
         
         forEach(this.elements, function(elem) {
            var s = elem.style, oldCss = s.cssText;
            if(oldCss) {
               s.cssText = oldCss + ";" + style;
            }else {
               s.cssText = style;
            }
         });
      },
         
      /**
       * Gets the offset {top,letf,width,height} of the currently matched element
       * @return {Object} the offset object with properties top, left, width, height for the
       * currently matched element or null, if no matched elements exist.
       * @example
       * // This alert the actual offsets of the element with id "myelem"
       * var o = $("#myelem").offsets();
       * alert(["top: ", o.top, ", left: ", o.left, ", width: ", o.width, ", height: ", o.height].join(""));
       */
      offsets: function() {
         var elements = this.elements;
         return elements.length === 0 ? null : getOffsets(elements[0]);
      },
      
      boundingBox: function() {
         var elems = this.elements;
         return elems.length ? getBoundingBox(elems[0]) : null;
      }
   });
         
})(h5);



