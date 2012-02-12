QUnit.config.autostart = false;

var AllTests = (function() {
   function byId(id) {
      return document.getElementById(id);
   }
   
   return {
      run: function() {
         /* ------------------------------------- core ------------------------------------------ */
         module("h5.js");
         test("h5 and $ object test", function() {
            expect(3);
            ok(h5, "h5 object exists as property of global object");
            ok($, "$ alias exists as property of global object");
            same($, h5, "$ and h5 are the same object");
         });
         
         test("basic test", function() {
            equals($().count(), 0, "$().count must be 0");
            equals($("").count(), 0, "$('').count must be 0");
         });
         
         test("Basic selector test", function() {
            equals($("span").selector, "span", "$(<selector>).selector === <selector>");
            equals($($("span")).selector, "span", "$($(<selector>)).selector === <selector>");
         });
         
         test("Test selector passing context", function() {
            same($(".innerHTML", byId("qunit-fixture")).get(0), byId("innerHTML"), 
                  "$(selector, domcontext) with DOM element as context to $");
            same($(".innerHTML", $("#qunit-fixture")).get(0), byId("innerHTML"), 
                  "$(selector, $context) with another h5 object as context to $");
         });
         
         test("$(selector).get(index) test", function() {
            var divs = $("div", $("#qunit-fixture")); 
            equals(divs.get(0).nodeName.toLowerCase(), "div", "$.get() test");
            equals(divs.get(1).nodeName.toLowerCase(), "div", "$.get() test");
         });
         
         test("$.html() test", function() {
            equals($("<p>Hello <span>World</span></p><div>Hi</div>").count(), 2, 
                  "$('<html>') test with html markup to $");
            equals($("<tr><td>Hello World</td></tr><tr><td>Yello World</td></tr>").html().toLowerCase(), 
                  "<td>hello world</td><td>yello world</td>", "$('<html>').html() === <html> test");
         });
         
         test("$(selector).forEach test", function() {
            var counter = 0;
            $("#forEach>option").forEach(function(e, i) {counter++;});
            equals(counter, 3, "$.(selector).forEach(function) test");
         });
         
         test("$(selector).filter test", function() {
            var retVal = $("option").filter(function(e, i) {
               return $(e).attr("value") === "a";
            });
            equals(retVal.length, 3, "$(selector).filter(funct) test");         
         });
         
         test("$.forEach() test", function() {
            var x = 0, arr = [];
            $.forEach([1,2,3,4,5], function(v, i) {
                  x += v;
            });
            equals(x, 15, "$.forEach(Array, function) test");
            
            $.forEach({a:"A", b:"B", c:"C"}, function(val, key) {
               arr[arr.length] = val;
            });
            equals(arr.join(""), "ABC", "$.forEach(Object, function) test"); 
         });
         
         test("$.filter() test", function() {
            var arr = $.filter([1,2,3,4,5], function(v, i) {return v % 2 === 0;});
            equals(arr.join(","), "2,4", "$.filter(Array, function) test");
            
            arr = $.filter({a:"A", b:"B", c:"C"}, function(v, k) {
               return k === "a" || k === "c";
            });
            equals(arr.join(","), "A,C", "$.filter(Object, function) test");
         });
         
         
         /* ------------------------------------- dom ------------------------------------------- */
         module("dom.js");
         test("$(sel).html() test", function() {
            equals($("#innerHTML").html(), "innerHTML test", "$.html() test");   
            equals($("#innerHTML").html("<span>Hello World</span><p>hey</p>").html().toLowerCase(), 
               "<span>hello world</span><p>hey</p>", "$.html(somehtml) test");
         });
         
         test("$(sel).attr() test", function() {
            equals($(".attrTest").attr("class"), "attrTest", "$(sel).attr(name) test");
            equals($(".attrTest").attr("class", "foo").hasClass("foo"), true, 
               "$(sel).attr('class', value).hasClass(value) test");
            equals($(".foo").attr("class", "foo").attr("class"), "foo", 
               "$(sel).attr('class') classname test");
            equals($("#foo").attr("value", "voo").val(), "voo", 
               "$(sel).attr('value', val).val() === val, input value test");
            equals($("#foo").attr("value"), "voo", "$(sel).attr('name') input val test");
         });
         
         test("$(sel).append() test", function() {
            equals($("#mytable").append("<tr id='foo'><td>Hello</td></tr>")
               .find("#foo:first-child").html().toLowerCase(), "<td>hello</td>", "Table insertion test");
         });
         
         test("$(sel).prepend() test", function() {
            equals($("#mytable").prepend("<tr id='boo'><td>Yello</td></tr>")
               .find("#boo:first-child").html().toLowerCase(), "<td>yello</td>", "Table insertion test");
         });
         
         test("$(sel).val() test", function() {
            equals($("#foo").val("foo").val(), "foo", "$(sel).val() test");
            equals($("#foo").val("bar").val(), "bar", "$(sel).val(value) test");
            // textarea
            equals($("#bar").val(), "Hello Bar", "$(sel).val() test for textarea");
            equals($("#bar").val("bar").val(), "bar", "$(sel).val(value) test for textarea");
            // select
            equals($("#baz").val(), "b", "$(sel).val() test for select");
            equals($("#baz").val("c").val(), "c", "$(sel).val(value) test for select");
            equals($("#bazz").val().join(" "), "a b c", "$(sel).val() test for multiple select");
            equals($("#bazz").val("c").val(), "c", "$(sel).val() test for multiple select");
            equals($("#bazz").val(["b", "c"]).val().join(" "), "b c", 
               "$(sel).val() test for multiple select set multiple values");
         });
         
         test("$(sel).remove() test", function() {
            $("#innerHTML").html("Hell<span>o World</span>, Yeah");
            equals($("#innerHTML").remove("span").html(), "Hell, Yeah", "$(selector).remove(selector) test");
         });
         
         test("Css class name tests", function() {
            equals($(".clsTest").hasClass("clsTest"), true, "$(sel).hasClass(val) test");
            equals($(".clsTest").addClass("bar").hasClass("bar"), true, "$(sel).addClass(val) test");
            equals($(".clsTest").removeClass("bar").hasClass("bar"), false, "$(sel).removeClass(val) test");
         });
         
         test("$(sel).data() test", function() {
            equals($("#innerHTML").data("test", "testvalue").data("test"), 
               "testvalue", "$(sel).data(name, value) test");
         });
         
         // finally start QUnit
         QUnit.start();
      }
   }; 
})();
