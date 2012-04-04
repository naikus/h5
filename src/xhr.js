/**
 * Convenience wrapper around XMLHttpRequest
 * @author aniketn3@gmail.com
 */
(function($) {
   var forEach = $.forEach,
      isTypeOf = $.isTypeOf,
      getTypeOf = $.getTypeOf,
      slice = $.slice,
      noop = function() {},
      extend = $.extend,
      xmlhttp = window.XMLHttpRequest,
      doc = $(document), // for global ajax events
      uuid = $.uuid,  
      mimeTypes = {
         json: "application/json",
         xml:  "application/xml",
         html: "text/html",
         text: "text/plain"
      },
      
      /**
       * Data handlers convert data to the expected type when a response is received
       * from the server
       */
      handlers = {
         xml: function(req) {
            var rDoc = req.responseXML, root = rDoc.documentElement;
            if(root && root.nodeName === "parseerror") {
               throw new Error("parseerror");
            }
            return rDoc;
         },
         json: function(req) {
            return JSON.parse(req.responseText);
         },
         text: function(req) {
            return req.responseText;
         }
      },
      
      /**
       * The default ajax properties
       */
      xDefaults = {
         url: window.location.href,
         method: "GET",
         contentType: "application/x-www-form-urlencoded",
         async: true,
         data: null,
         dataType: "text",
         //timeout: -1,
         headers: {},
         success: noop,
         error: noop
      };
      
   function dispatch(evt, data) {
      try {
         doc.dispatch(evt, data);
      }catch(e) {
         console.log("Error dispatching ajax event: " + e.message);
      }
   }
      
   function jsonp(url, success) {
      var jpId = "_jsonp" + uuid(), script,
         src = url.replace("callback=?", "callback=" + jpId)
            .replace("jsonp=?", "jsonp=" + jpId),
         handler = function() {
            // dispatch an ajax start event
            dispatch("ajaxend", url);
            success.apply(null, slice(arguments));
         };
      window[jpId] = handler;
      // dispatch an ajax start event
      dispatch("ajaxstart", url);
      script = $(document.createElement("script")).attr({src: src, type: "text/javascript"});
      $("head").append(script);
   }
      
   function xhr(options) {
      var req, opt = extend({}, xDefaults, options), url = opt.url, dType = opt.dataType, 
         data = opt.data, mime = mimeTypes[dType] || "text/plain";
         
      // dispatch ajax start event on document
      dispatch("ajaxstart", url);
      
      req = xmlhttp ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
      if(opt.username) { 
         req.open(opt.method, url, opt.async, opt.username, opt.password);
      }else {
         req.open(opt.method, url, opt.async);
      }
      
      forEach(opt.headers, function(v, k) {
         req.setRequestHeader(k, v);
      });
      req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      
      req.onreadystatechange = function() {
         var state = req.readyState, code, err, data, handler;
         if(state === 4) {
            code = req.status;
            if((code >= 200 && code < 300) || code === 0) {
               dispatch("ajaxsuccess", url);
               handler = handlers[dType] || handlers.text;
               try {
                  data = handler(req);
               }catch(error) {
                  err = error;
               }
               if(err) {
                  opt.error(err, req);
               }else {
                  opt.success(data, req);
               }
            }else {
               dispatch("ajaxerror", {data: {url: url, status: code}});
               opt.error(code, req);
            }
            
            // dispatch an ajax complete event on document
            dispatch("ajaxend", url);
         }
      };
      
      if(data) {
         req.setRequestHeader("Content-Type", opt.contentType);
         req.setRequestHeader("Accept", mime);
      }
      
      if(isTypeOf(data, "Object")) {
         try {
            data = JSON.stringify(data, null, "");
            req.setRequestHeader("Content-Type", mime);
         }catch(e) {}
      }
      req.send(data);
   }
   
   /**
    * Makes an XMLHttpRequest with the options specified.
    * @param {Object} options The options for this request. The options object can contain the
    * following properties
    *
    * <pre>
    * url         (String)     The url to make the ajax request     (window.location.href)
    * method      (String)     The HTTP method (GET|POST|HEAD)      ("GET")
    * contentType (String)     The content type of this request     ("application/x-www-form-urlencoded")
    * async       (boolean)    Whether to make an async request     (true)
    * data        (DOM|Object|String) The data to send with request (null)
    * dataType    (String)     The expected resultent dataType      
    *                          ("xml"|"text"|"json")                (null)
    * username    (String)     Optional username if required        (null)
    * password    (String)     Optional password if required        (null)
    * timeout     (Number)     The time in milliseconts to wait     (currently not used)
    *                          for response                         (-1 indefinite)
    * headers     (Object)     Various headers as key:value         ({})
    *
    * success     (function)   The (optional) handler thats called on successful
    *                          completion of request. options.success(data, xhr-object)
    *
    * error       (function)   The (optional) handler thats called when an error occurs during
    *                          ajax request. options.error(code | error, xhr-object)
    * </pre>
    * @function
    */
   $.xhr = xhr;
   
   /**
    * Makes a JSONP request
    * @param {String} url The url to make a call. Must be of the format http://domain/somepath?callback=?
    * @param {Function} success The success handler
    */
   $.jsonp = jsonp;
   
   /**
    * An alias for $.xhr;
    */
   $.ajax = xhr;
   
   /**
    * A convenience function to GET data from server
    * @param {String} url The url to get data from
    * @param {Function} success The function thats called when ajax succeeds
    * All the other parameters are set to default
    */
   $.get = function(url, success) {
      xhr({url:url, success: success});
   };
   
   /**
    * A convenience function to POST the data to the server
    * @param {String} url The url to get data from
    * @param {Object|DOM|String} data The data to post (optional)
    * @param {Function} success The function thats called when ajax succeeds
    * @param {String} dType The data type of the data expected from server, e.g. xml,json,text 
    */
   $.post = function(url, data, success, dType) {
      var opt = {url: url, data: data, success: success};
      if(dType) {
         opt.dataType = dType;
      }
      xhr(opt);
   };
   
   /**
    * An alisa to $.ajax({url:url, success:success, dataType:"json"}); 
    * @param {String} url The url to get data from
    * @param {Function} success The function thats called when ajax succeeds
    * @param {Function} error The function thats called when ajax encounters an error
    */
   $.getJson = function(url, success, error) {
      var opt = {url: url, success: success, dataType: "json"};
      if(getTypeOf(error) === "Function") {
         opt.error = error;
      }
      xhr(opt);
   };
   
   /**
    * Allows to load the contents of the specified url into this element.
    */
   $.extension("load", function(url, selector, success) {
      var elems = this.elements, me = this, sel = selector, callback = success;
      if(typeof sel === "function") {
         callback = selector;
         sel = null;
      }
      
      if(elems.length > 0) {
         xhr({
            url: url, 
            success: function(data, req) {
               me.html(sel ? $(document.createElement("div")).html(data).find(sel) : data);
               if(callback) {
                  callback(data, req);
               }
            }
         });
      }
      return this;
   });
})(h5);
