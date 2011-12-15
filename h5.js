/*jslint
    nomen: false,
    debug: true,
    indent: 3,
    plusplus: false,
    evil: true, 
    onevar: true,
    browser: true,
    white: false
*/
/*global
    window: true,
    navigator: true,
    XMLHttpRequest: true,
    ActiveXObject: true,
    unescape: true
*/
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
        h5;

    /* ------------------------------- Utility functions ----------------------------------------- */
    /**
     * Console logging
     */
    if(typeof global.console === "undefined") {
        global.console = (function() {
            var log = global.opera ? global.opera.postError : function() {};
            return {
                log: log
            };
        })();
    }
   
    function createObject(objFrom) {
        if(Object.create) {
            return Object.create(objFrom);
        }
        function F() {}
        F.prototype = objFrom;
        return new F();
    }
   
    function getTypeOf(that) {
        // why 8? cause the result is always of pattern '[object <type>]'
        return objToString.call(that).slice(8, -1); 
    }
   
    function isTypeOf(that, type) {
        return objToString.call(that).slice(8, -1) === type;
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
            arr = [];
            for(i = s; i < e; i++) {
                arr[arr.length] = this[i];
            }
        }
        return arr;
    }
    
    // normalize the slice function
    (function() {
        try {
            slice.call(document.getElementsByTagName("html")); // this fails below IE9
        }catch(err) {
            console.log("Array slice does not work on array-like objects, using custom slice");
            slice = sliceList;
        }
    })();
   
    /**
     * Extends the target object from multiple sources
     * @param target {Object} The object that will be the result of extension
     * @param source {Object} The source object from which to extend
     */
    function extend(target, source /*, souce1, souce2, ... */) {
        var sources = slice.call(arguments, 1);
        sources.forEach(function(src) {
            for(var k in src) {
                target[k] = src[k];
            }
        });
    }
   
   
    /* ---------------------------- iteration functions ------------------------------------------ */
   
    function forEach(arr, callback, thisObj) {
        var o = Object(arr), forEach = arr.forEach, key;
        if(forEach && isFunction(forEach)) {
            arr.forEach(callback, thisObj);
        }else {
            for(key in o) {
                callback.call(thisObj, o[key], key, arr);
            }
        }
    }
   
    function filter(arr, callback, thisObj) {
        var o = Object(arr), filter = arr.filter, ret;
        if(filter && isFunction(filter)) {
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
   
    function map(arr, callback, thisObj) {
        var ret = [];
        forEach(arr, function(val, i, arr) {
            var retVal = callback.call(thisObj, val);
            if(retVal !== null && typeof retVal !== "undefined") {
                ret[ret.length] = retVal;
            }
        });
    }

    
    /* ------------------------------- The nodelist ---------------------------------------------- */
    h5 = (function() {
        var htmlRe = /^\s*<(\w+)[^>]*>/,
            gcs = window.getComputedStyle,
            isIe = !!window.ActiveXObject,
            table = document.createElement("table"),
            tbody = document.createElement("tbody"),
            tr = document.createElement("tr"),
            div = document.createElement("div"),

            hasqsa = !! document.querySelectorAll,
            selEngine = global.selectorEngine,

            containers = {
                "*": div,
                table: table,
                tbody: table,
                tfoot: table,
                tr: tbody,
                td: tr,
                th: tr
            },

            nt = {
                ELEMENT_NODE: 1,
                ATTRIBUTE_NODE: 2,
                TEXT_NODE: 3,
                // CDATA_SECTION_NODE: 4, ENTITY_REFERENCE_NODE: 5, ENTITY_NODE: 6, PROCESSING_INSTRUCTION_NODE: 7, COMMENT_NODE: 8,
                DOCUMENT_NODE: 9
            //, DOCUMENT_TYPE_NODE: 10, DOCUMENT_FRAGMENT_NODE: 11, NOTATION_NODE: 12
            },

            domApi, h5Proto;
         
      
        function isNodeList(that) {
            if(!that) {
                return false;
            }
            var thatType = getTypeOf(that);
            return thatType === "NodeList" || thatType === "HTMLCollection" || (that.item && (that.length !== undef));
        }
         
        function validElem(elem)   {
            return elem && elem.nodeType === nt.ELEMENT_NODE;
        }
      
        function fragments(html, tgName) {
            var c, ret, children;
            if(!tgName) {
                ret = htmlRe.exec(html);
                tgName = ret ? ret[1] : null;
            }
            c = containers[tgName] || div;
            c.innerHTML = "" + html;
            children = c.childNodes;
            return slice.call(children);
        }
      
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
                        qr = (c || doc).querySelectorAll(s);
                    }else if(selEngine) {
                        qr =  selEngine(s, c || doc);
                    }else {
                        throw new Error("No selector engine found. Set custom engine via window.selectorEngine property");
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
            }
            return ret;
        }
        
        function getFrags(nodeName, html, isTable) {
            var frags;
            html += "";
            if(!isIe) {
                frags = fragments(html);
            }else {
                div.innerHTML = ["<", nodeName, ">", html, "</", nodeName, ">"].join("");
                frags = isTable ? div.firstChild.firstChild.childNodes : div.firstChild.childNodes;
            }
            return frags;
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
                frags = getFrags(nodeName, html, isTable);
            }else if(html.nodeName) { // dom node
                frags = [html];
            }else if(html.elements) { // h5 object
                frags = html.elements;
            }else if(isArray(html) || isNodeList(html)) { // array or nodelist
                frags = html;
            }else {
                frags = getFrags(nodeName, html, isTable);
            }
            
            // if its table, pass in the tbody, else pass in the element
            cbElem = isTable ? (element.getElementsByTagName("tbody")[0] || element) : element;      
            callback(cbElem, slice.call(frags));
        }
        
        domApi = {
            setHtml: function(elem, html)  {
                if(isTypeOf(html, "String")) {
                    try {
                        elem.innerHTML = html;
                    }catch(e)   {
                        domApi.replace(elem, html);
                    }
                }else {
                    domApi.replace(elem, html);
                }
            },
            
            append: function(elem, html) {
                domify(elem, html, function(appendTo, arrNodes) {
                    forEach(arrNodes, function(node) {
                        appendTo.appendChild(node);
                    });
                });
            },
            
            prepend: function(elem, html) {
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
            },
            
            replace: function(elem, html) {
                domify(elem, html, function(appendTo, arrNodes) {
                    appendTo = removeAll(appendTo);
                    domApi.append(appendTo, arrNodes);
                });
            },
            
            hasClass: function(elem, clName) {
                var cList, arr, i, len;
      
                if(!validElem(elem)) {
                    return false;
                }
                // check for HTML5 element.classList (DOMTokenList)
                cList = elem.classList;
                if(cList) {
                    return cList.contains(clName);
                }
      
                arr = (elem.className || "").split(" ");
                for(i = 0, len = arr.length; i < len && arr[i] !== clName; i++){}
                return i < arr.length;
            },
            
            addClass: function(elem, clName)  {
                if(!clName) {
                    return;
                }
                if(validElem(elem))  {
                    var cList = elem.classList;
                    if(cList) {
                        cList.add(clName);
                        return;
                    }
                    if(!domApi.hasClass(elem, clName))  {
                        elem.className += " " + clName;
                    }
                }
            },
            
            removeClass: function(elem, clName) {
                var cList, strClasses, classes, updatedCls;
      
                if(validElem(elem))  {
                    cList = elem.classList;
                    if(cList) {
                        cList.remove(clName);
                        return;
                    }
      
                    strClasses = (elem.className || "");
                    if(strClasses.indexOf(clName) !== -1)   {
                        classes = strClasses.split(" ");
                        updatedCls = filter(classes, function(val, idx) {
                            return val !== clName;
                        });
                        elem.className = updatedCls.join(" ");
                    }
                }
            },
            
            data: function(elem, prop, val) {
                var arglen = arguments.length, dmap = elem.datamap;
                if(!dmap) {
                    elem.datamap = dmap = {};
                }
      
                if(arglen === 1)  {
                    return dmap;
                }else if(arglen === 2) {
                    return dmap[prop];
                }else {
                    dmap = elem.datamap = elem.datamap || {};
                    dmap[prop] = val;
                    return null;
                }
            },
            
            getStyle: function(elem, prop)   {
                var cs;
                if(gcs)  {
                    cs = gcs(elem, null);
                }else {
                    cs = elem.currentStyle;
                }
                return cs[prop];
            },
            
            setStyle: function(elem, props) {
                var style = elem.style;         
                forEach(props, function(val, key) {
                    style[key] = val;
                });
            },
            
            getOffsets: function(elem)  {
                var o = {
                    left: elem.offsetLeft, 
                    top: elem.offsetTop,
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
        };

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
                var elements = this.elements;
                return elements ? elements.length : 0;
            },
            
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
                var elements = this.elements;
                if(arguments.length === 0) {
                    return elements.length === 0 ? null : elements[0].innerHTML;
                }
                forEach(elements, function(el) {
                    domApi.setHtml(el, markup);
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
            attr: function(name, value)   {       
                var n = name === "class" ? "className" : name, elem, elements = this.elements;

                if(elements.length === 0)  {
                    return value ? this : null;
                }
                elem = elements[0];
                if(arguments.length === 1) {
                    return elem.getAttribute(name) || elem[n];
                }else {
                    elem.setAttribute(name, value);
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
                var n, opts, vals, opv, el, ret, elements = this.elements;
                if(elements.length === 0) {
                    return this;
                }

                if(arguments.length === 1) {
                    forEach(elements, function(elem) {
                        n = elem.nodeName.toLowerCase();
                        if(n === "select") {
                            opts = nodelist("option", elem).elements;
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
                        opts = nodelist("option", el).elements;
                        forEach(opts, function(opt) {
                            if(opt.selected) {
                                opv = opt.value || opt.innerHTML;
                                ret[ret.length] = opv;
                            }
                        });
                        
                        return ret.length === 0 ? "" : ret.length == 1 ? ret[0] : ret;
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
                    return domApi.data(elements[0], name);
                }else {
                    forEach(elements, function(elem) {
                        domApi.data(elem, name, value);
                    });
                }
                return this;
            },
            
            /**
             * Appends the html content (node, or html string) to the first matching element.
             * @param {String|Node} html The html content to append
             * @return {Object} the same nodelist for chaining
             */
            append: function(html)  {
                var elements = this.elements;
                if(! html || elements.length === 0) {
                    return this;
                }
                domApi.append(elements[0], html); 
                return this;
            },
            
            /**
             * Prepends the html to the first matching element in this context (nodelist)
             * @param {String|Node} html The html content to prepend (insertbefore)
             * @return {Object} the nodelist object for chaining
             */
            prepend: function(html) {
                var elements = this.elements;
                if(! html || elements.length === 0) {
                    return this;
                }
                domApi.prepend(elements[0], html); 
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
            remove: function(selector)  {
                var elems, elem, c, elements = this.elements;
                if(elements.length === 0)  {
                    return this;
                }

                c = elements[0];
                elems = nodelist(selector, c).elements;
                forEach(elems, function(elem) {
                    c.removeChild(elem);
                });
                return this;
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
                if(getTypeOf(selector) !== "String") {
                    return selector;
                }
                return elements.length === 0 ? nodelist(selector) : nodelist(selector, elements[0]);
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
                var elements = this.elements;
                if(elements.length === 0) {
                    return false;
                }
                return domApi.hasClass(elements[0], cl);
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
                if(elements.length === 0) {
                    return this;
                }
                forEach(elements, function(el) {
                    domApi.addClass(el, cl);
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
                var elements = this.elements;
                if(elements.length === 0) {
                    return this;
                }
                forEach(elements, function(el) {
                    domApi.removeClass(el, cl);        
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
             * var bgcolor = $("#foo").getStyle("background-color");
             */
            getStyle: function(prop)   {
                var elements = this.elements;
                return elements.length === 0 ? "" : domApi.getStyle(elements[0], prop);
            },
            
            /**
             * Sets the css style properties <tt>props</tt> for all the matched elements
             * @param {Object} props The style properties to set
             * @return {Object} the nodelist object chaining
             * @example
             * // This will set the border and background-color style properties all input elements
             * $("input").setStyle({
             *    "background-color": "#666",
             *    "border": "1px solid #333"
             * });
             */
            setStyle: function(props)  {
                forEach(this.elements, function(el) {
                    domApi.setStyle(el, props);
                });
                return this;
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
                return elements.length === 0 ? null : domApi.getOffsets(elements[0]);
            }
        };
      
        function nodelist(sel, ctx) {
            ctx = ctx ? ctx.elements ? ctx.elements[0] : ctx : null;
            var elemSel = elAndSel(sel, ctx), h5 = createObject(h5Proto);
            h5.elements = elemSel.e;
            h5.selector = elemSel.s;
            return h5;
        }
        
        /**
         * Expose useful utility functions
         */
        nodelist.forEach = forEach;
        nodelist.filter = filter;
        nodelist.map  = map;
        nodelist.getTypeOf = getTypeOf;
        nodelist.isTypeOf = isTypeOf;
        
        /**
         * Expose a plugin API to extend 
         */
        nodelist.plugin = function(/* [name, pluginFunc] | object */) {
            var pluginObj = arguments[0], pluginFunc = arguments[1], name = pluginObj, 
            arg1Type = getTypeOf(pluginObj);      
            
            if(arg1Type === "String" && isFunction(pluginFunc)) {
                if(h5Proto[name]) {
                    console.log("Warning! Plugin " + name + " is already defined");
                }
                h5Proto[name] = function(options) {
                    return pluginFunc.call(this, options);
                };
            }else if(arg1Type === "Object") {
                forEach(pluginObj, function(valFunc, key) {
                    if(isFunction(valFunc)) {
                        nodelist.plugin(key, valFunc);
                    }
                });
            }else {
                console.log("Invalid plugin definition");
            }
        };
        
        return nodelist;
    })();
    
    global.h5 = global.$ = h5;
    
})(this);
