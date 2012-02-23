# h5
#### A mini, modular javascript library for building mobile (and small desktop) apps.


### Goals
h5 aims to be a mini javascript library that can be used to build mobile and small desktop apps targetted towards latest browsers. Although h5 also provides extensions and a way to make it work with older browsers upto IE6.


### Features
- The familiar '$', also available as 'h5' globally.
- A small core h5.js
- An 'extension' API to plug in new extensions to h5, via $.extension(...).
- A way to plug-in a different selector engine. Uses document.querySelectorAll by default.
- An few basic extensions (dom, event, events-for-ie, xhr, touch support)


### Building
h5 can be used as is including all the js files or can be built into a single js file h5.js. It requires ant to build. For a list of included modules included in each build target see build.xml file.

- To build h5 for newer browsers type 

  $>ant
  
  This will generate h5.js (a combined file with code comments) and a h5.min.js file which is a minified file with various modules. 


- For older browsers type

  $>ant build-legacy
