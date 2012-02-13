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
    h5: true,
    navigator: true,
    XMLHttpRequest: true,
    ActiveXObject: true,
    unescape: true
*/
(function($) {
   var jpId = 0,
      forEach = $.forEach,
      noop = function() {},
      extend = $.extend,
      xmlhttp = window.XMLHttpRequest,
      activeX = window.ActiveXObject,
      uuid = $.uuid,      
      mimeTypes = {
         json: "application/json",
         xml:  "application/xml",
         html: "text/html",
         text: "text/plain"
      },
      handlers = {
         xml: function(xhr) {
            var doc = xhr.responseXML, root = doc.documentElement;
            if(root && root.nodeName === "parseerror") {
               throw new Error("parseerror");
            }
            return doc;
         },
         json: function(xhr) {
            return JSON.parse(xhr.responseText);
         },
         text: function(xhr) {
            return xhr.responseText;
         }
      },
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
      
   function xhr(options) {
      var req, opt = extend({}, xDefaults, options), url = opt.url, dType = opt.dataType, 
         data = opt.data, mime = mimeTypes[dType] || "text/plain";
      
      req = xmlhttp ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
      req.open(opt.method, url, opt.async, opt.uname, opt.password);
      
      forEach(opt.headers, function(v, k) {
         req.setRequestHeader(k, v);
      });
      req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      
      req.onreadystatechange = function() {
         var state = req.readyState, code, msg, err, data, handler;
         if(state === 4) {
            code = req.status;
            if((code >= 200 && code < 300) || code === 0) {
               handler = handlers[dType] || handlers.text;
               try {
                  data = handler(xhr);
               }catch(error) {
                  err = error;
               }
               if(err) {
                  opt.error(err, xhr);
               }else {
                  opt.success(data, xhr);
               }
            }else {
               opt.error(code, xhr);
            }
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
      xhr.send(data);
   }
   
   $.xhr = xhr;
   $.ajax = xhr;
   $.get = function(url, success) {
      xhr({url:url, success: success});
   };
   $.post = function(url, data, success, dType) {
      var opt = {url: url, data: data, success: success};
      if(dType) {
         opt.dataType = dType;
      }
      xhr(opt);
   };
   $.getJson = function(url, success) {
      xhr({url: url, success: success, dataType: "json"});
   };
   
   $.extension("load", function(url, selector, success) {
      var elems = this.elements, me = this, sel, callback;
      if(typeof sel === "function") {
         callback = selector;
         sel = null;
      }
      
      if(elems.length == 0) {
         return this;
      }
      xhr({url: url, success: function(data) {
         me.html(sel ? $(document.createElement("div")).html(data).find(sel) : data);
      }});
   });
})(h5);
