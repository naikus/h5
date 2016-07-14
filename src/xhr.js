/**
 * Convenience wrapper around XMLHttpRequest
 * @author aniketn3@gmail.com
 */
(function($) {
   var forEach = $.forEach,
      // isTypeOf = $.isTypeOf,
      getTypeOf = $.getTypeOf,
      slice = $.slice,
      noop = function() {},
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
            var resTxt = req.responseText;
            if(resTxt) {
               return JSON.parse(req.responseText);
            }
            return "";
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
         async: true,
         data: null,
         dataType: "text",
         //timeout: -1,
         headers: {
            "Content-Type": "application/x-www-form-urlencoded"
         },
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
         source = url.replace("callback=?", "callback=" + jpId)
            .replace("jsonp=?", "jsonp=" + jpId),
         handler = function() {
            // dispatch an ajax start event
            dispatch("ajaxend", url);
            success.apply(null, slice(arguments));
         };
      window[jpId] = handler;
      // dispatch an ajax start event
      dispatch("ajaxstart", url);
      script = $(document.createElement("script")).attr({src: source, type: "text/javascript"});
      $("head").append(script);
   }
      
   function xhr(options) {
      var req, opt = $.shallowCopy({}, xDefaults, options), url = opt.url, dType = opt.dataType, 
         data = opt.data, postData, mime = mimeTypes[dType] || "text/plain", wasConnected = false;
         
      // dispatch ajax start event on document
      dispatch("ajaxstart", url);
      
      req = xmlhttp ? new XMLHttpRequest({mozSystem: true}) : new ActiveXObject("Microsoft.XMLHTTP");
      if(opt.username) { 
         req.open(opt.method, url, opt.async, opt.username, opt.password);
      }else {
         req.open(opt.method, url, opt.async);
      }
      
      if(data) {
         // req.setRequestHeader("Content-Type", opt.contentType);
         req.setRequestHeader("Accept", mime);
      }
      req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      if(opt.headers) {
         for(var k in opt.headers) {
            req.setRequestHeader(k, opt.headers[k]);
         }
      }
      
      if(opt.timeout) {
        req.timeout = opt.timeout;
        req.ontimeout = function() {
          (opt.ontimeout ? opt.ontimeout() : opt.error("timeout"));
        };
      }
      
      req.onreadystatechange = function() {
         var state = req.readyState, code, err, data, handler;
         
         // This is for safari/chrome where ready state is 4 but status is 0 in case of local
         // files i.e. file://
         if(state === 2 || state === 3) {
           wasConnected = true;
         }
         
         if(state === 4) {
            code = req.status;
            if((code >= 200 && code < 400) || (code === 0 && wasConnected)) {
               dispatch("ajaxsuccess", url);
               handler = handlers[dType] || handlers.text;
               try {
                  data = handler(req);
               }catch(error) {
                  console.log("Error parsing ajax response: " + error);
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
      
      postData = data || null;
      req.send(postData);
   }
   
   /**
    * Makes an XMLHttpRequest with the options specified.
    * @param {Object} options The options for this request. The options object can contain the
    * following properties
    *
    * <pre>
    * url         (String)     The url to make the ajax request     (window.location.href)
    * method      (String)     The HTTP method (GET|POST|HEAD)      ("GET")

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
    * @param {Function} error The function thats called when ajax has an error
    * All the other parameters are set to default
    */
   $.get = function(url, success, error) {
      xhr({url:url, success: success, error: error});
   };
   
   /**
    * A convenience function to POST the data to the server
    * @param {String} url The url to get data from
    * @param {Object} Options for this post request
    */
   $.post = function(url, opts) {
      var opt = $.shallowCopy(opts, {url: url, method: "POST"});
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
      var elems = this.h5Elements, me = this, sel = selector, callback = success;
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