module("nodelist");

test("Basic", function() {
   expect(2);
   ok(h5, "h5");
   ok($, "$");
});

test("h5", function(){
   var count = 0, arr;
   
   equals($().count(), 0, "$()");
   equals($("").count(), 0, "$('')");
   //raises(function() {$("#");},  "$('#') Throws Syntax Error"); fails in IE6 becacuse of CssQuery
   equals($("span").selector, "span", "$(<selector>).selector === <selector>");
   equals($($("span")).selector, "span", "$($(<selector>)).selector === <selector>");
   
   // context
   ok($("#innerHTML", document.getElementById("qunit-fixture")), "$(selector, domcontext) test");
   ok($("#innerHTML", $("#qunit-fixture")), "$(selector, $context) test");
   
   // $(html markup)
   equals($("<p>Hello <span>World</span></p><div>Hi</div>").count(), 2, "$('<markup>') test");
   equals($("<tr><td>Hello World</td></tr><tr><td>Yello World</td></tr>").html().toLowerCase(), 
      "<td>hello world</td><td>yello world</td>", "$('<markup>') test");
   
   //forEach
   $("#baz>option").forEach(function(e, i) {
      console.log("option: " + e);
      count++;
   });
   equals(count, 3, "$(selector).forEach(func) test");
   count = 0;
   
   // filter
   arr = $("option").filter(function(e, i) {
      return $(e).attr("value") === "a";
   });
   console.log(arr);
   equals(arr.length, 2, "$(selector).filter(funct) test");
   
   // $.get
   equals($("div", $("#qunit-fixture")).get(0).nodeName.toLowerCase(), "div", "$.get() test");
   
   // $.forEach
   var x = 0;
   $.forEach([1,2,3,4,5], function(v) {
       x += v;
   });
   equals(x, 15, "$.forEach() test");
   
   x = $.filter([1,2,3,4,5], function(v) {return v % 2 === 0;});
   equals(x.join(","), "2,4", "$.filter() test");
   
});


test("dom", function() {
   // $.html
   equals($("#innerHTML").html(), "innerHTML test", "$.html() test");
   
   equals($("#innerHTML").html("<span>Hello World</span>").html().toLowerCase(), "<span>hello world</span>", "$.html(somehtml) test");
   
   
   // $.attr
   equals($(".attrTest").attr("class"), "attrTest", "$.attr(name) test");
   equals($(".attrTest").attr("class", "foo").hasClass("foo"), true, "$.attr(name, value) classname test");
   equals($(".foo").attr("class", "foo").attr("class"), "foo", "$.attr(name, value) classname test");
   equals($("#foo").attr("value", "voo").val(), "voo", "$.attr(name, value) input value test");
   equals($("#foo").attr("value"), "voo", "$.attr(name, value) input value test");
   
   // $.data
   equals($("#innerHTML").data("test", "testvalue").data("test"), "testvalue", "$.data(name, value) test");
   
   // $.append
   equals($("#mytable").append("<tr id='foo'><td>Hello</td></tr>").find("#foo:first-child").html().toLowerCase(), "<td>hello</td>", "Table insertion test");
   
   equals($("#mytable").prepend("<tr id='boo'><td>Yello</td></tr>").find("#boo:first-child").html().toLowerCase(), "<td>yello</td>", "Table insertion test");
   
   
   // $.val
   equals($("#foo").val("foo").val(), "foo", "$.val() test");
   equals($("#foo").val("bar").val(), "bar", "$.val(value) test");
      // textarea
   equals($("#bar").val(), "Hello Bar", "textarea $.val() test");
   equals($("#bar").val("bar").val(), "bar", "textarea $.val(value) test");
      // select
   equals($("#baz").val(), "b", "select $.val() test");
   equals($("#baz").val("c").val(), "c", "select $.val(value) test");
   
   equals($("#bazz").val().join(" "), "a b c", "$.val multiple select test");
   equals($("#bazz").val("c").val(), "c", "$.val multiple select test");
   equals($("#bazz").val(["b", "c"]).val().join(" "), "b c", "$.val multiple select set multiple values");
});