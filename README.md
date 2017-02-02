<img src=https://solsort.solsort.com/icon.png width=96 height=96 align=right>

[![website](https://img.shields.io/badge/website-solsort.solsort.com-blue.svg)](https://solsort.solsort.com/) 
[![github](https://img.shields.io/badge/github-solsort/solsort-blue.svg)](https://github.com/solsort/solsort)
[![codeclimate](https://img.shields.io/codeclimate/github/solsort/solsort.svg)](https://codeclimate.com/github/solsort/solsort)
[![travis](https://img.shields.io/travis/solsort/solsort.svg)](https://travis-ci.org/solsort/solsort)
[![npm](https://img.shields.io/npm/v/solsort.svg)](https://www.npmjs.com/package/solsort)

# solsort development library

*Unstable - under development - do not use it yet*

Library, primarily for use within appedit. Wraps direape and reun, and adds extra functionality
# Examples

Make the app consist of a button, and replace it with text when clicked.

```javascript
solsort.handle('hello', () => solsort.html('bye');
solsort.html(`<button onclick=#{solsort.htmlEvent('hello')}>Hi</button>`);
```

# Dependencies

    var reun = require('reun@0.1');
    var da = require('direape@0.1');
    var ss = exports;
    
# DireApe passthrough
    
    ss.handle = da.handle;
    ss.jsonify = da._jsonify;
    ss.slice = da._slice;
    
# Utility functions
    
## set/get
    
    var keypath = k => typeof k === 'string' ? k.split('.') : k;
    
    ss.set = (k, v) => da.setJS(keypath(k), v);
    ss.get = (k, defaultValue) => da.getJS(keypath(k), defaultValue);
    
# UI

    
    ss.html = function html(h) { da.setJS(['ui', 'html'], h); };
    
## html event
    ss.htmlEvent = function htmlEvent(name, propagate) {
      return `require('${module.uri}').domEventHandler('${da.pid}','${name}'` +
          `,'${propagate}')(arguments[0])`;
    };
    
    var eventWhitelist =
    ['timeStamp', 'target', 'touches', 'clientX', 'clientY',
      'charCode', 'keyCode', 'key', 'code', 'location',
      'altKey', 'shiftKey', 'ctrlKey', 'metaKey', 'repeat'];
    
    function domEventHandler(pid,name,propagate) {
      return function(e) {
        if(!propagate) {
          e.preventDefault();
        }
        var result = {};
        for(var i = 0; i < eventWhitelist.length; ++i) {
          var k = eventWhitelist[i];
          if (typeof e[k] !== 'undefined') {
            result[k] = ss.jsonify(e[k]);
          }
        }
        da.run(pid, name, result);
      }
    }
    ss.domEventHandler = domEventHandler;
    
## Autorender ['ui','html']

Automatically render `['ui', 'html']` to `#solsort-ui` element, when running in the main threa.
    
    if(typeof document !== 'undefined') {
      var react = require('react/dist/react.js');
      da.reaction('solsort:ui-renderer', () => {
        var rootElem = document.getElementById('solsort-ui');
        if(!rootElem) {
          return;
        }
        var html = da.getJS(['ui', 'html']);
        if(typeof html === 'string') {
          rootElem.innerHTML = html;
        } else if(Array.isArray(html)) {
          reun.run(() => {
            var dom = require('react-dom/dist/react-dom.js');
            dom.render(jsonml2react(html), document.getElementById('solsort-ui'));
          });
        }
      });
    }
    
## jsonml2dom

    function jsonml2dom(o) { 
      if(typeof o === 'string') {
        return document.createTextNode(o);
      } else if(typeof o === 'undefined') {
        return document.createTextNode('undefined');
      } else if(Array.isArray(o)) {
        var node = document.createElement(o[0]);
        var tagtype = o[0];
        var params = o[1];
        var firstChild;
        if(typeof params === 'object' && params.constructor === Object) {
          for(var k in params) {
            if(k === 'style') {
              Object.assign(node.style, params[k]);
            } else {
              node[k] = params[k];
            }
          }
          firstChild = 2;
        } else {
          params = {};
          firstChild = 1;
        }
        for(var i = firstChild; i < o.length; ++i) {
          node.appendChild(jsonml2dom(o[i]));
        }
        return node;
      } else {
        console.log('err', o, typeof o);
        throw 'unexpected type of parameter to jsonml2dom - ' + o;
      }
    }
    
## jsonml2react...

    function jsonml2react(o) {
      if(typeof o === 'string') {
        return o;
      } else if(Array.isArray(o)) {
        var name = o[0];
        var node = document.createElement(o[0]);
        var params = o[1];
        var args = o.slice(2);
    
        if(typeof params !== 'object' || params.constructor !== Object) {
          params = {};
          args = o.slice(1);
        }
    
        args = args.map(jsonml2react);
    
        for(var k in params) {
          var v = params[k];
          if(isSolsortEvent(params[k])) {
            params[k] = makeSolsortCallback(v);
          }
        }
    
In addition to normal element names, we also support names like
'npmModule:exportedSymbol', which loads an npm-module with require.
Example: `['react-star-rating:default', {name: 'hi', rating: 5}]`
    
        if(name.indexOf(':') !== -1) {
          name = name.split(':');
          name = require(name[0])[name[1]];
        }
    
        return require('react').createElement.apply(react, [name, params].concat(args));
      } else {
        console.log('err', o, typeof o);
        throw 'unexpected type of parameter to jsonml2dom - ' + o;
      }
    
    }
    
## ss.event
    
    ss.event = (name, opt) => {
      return {solsortEvent: Object.assign({name: name, pid: da.pid}, opt)};
    }
    
    function isSolsortEvent(o) {
      return o && typeof o === 'object' && o.solsortEvent && Object.keys(o).length === 1;
    }
    
    function makeSolsortCallback(o) {
      o = o.solsortEvent;
      return e => {
        if(o.stopPropagation) { e.stopPropagation(); }
        if(o.preventDefault) { e.preventDefault(); }
    
        var result = {};
        var extract = o.extract || [];
        if(typeof extract === 'string') {
          extract = [extract];
        }
        extract = extract.map(o => o.split('.'));
        for(var i = 0; i < extract.length; ++i) {
          jsSetIn(result, extract[i],
              jsGetIn(e, extract[i]))
        }
        da.run(o.pid, o.name, result);
      }
    }
    
    function jsSetIn(o, path, val) {
      if(!path.length) { return val; }
      var k = path[0];
      try { o[k] = o[k]; } catch(e) { o = {}; }
      o[k] = jsSetIn(o[k], path.slice(1), val);
      return o
    }
    
    function jsGetIn(o, path, defaultValue) {
      try {
        if(path.length === 1) {
          if(o[path[0]] === undefined) {
            return defaultValue;
          } else {
            return o[path[0]];
          }
        }
        return jsGetIn(o[path[0]], path.slice(1), defaultValue);
      } catch(e) {
        return defaultValue;
      }
    }
    
# Main function for testing
    
    ss.main = () => reun.run(() => {
      ss.handle('hello', o => console.log(o));
      ss.html(`<input onkeydown=${ss.htmlEvent('hello')}>`);
      if(window.document) {
        ss.handle('here', o => alert(`hello (${o.clientX},${o.clientY})`));
        ss.handle('textChange', o => console.log(o));
        ss.html(['div',
              ['h1', {onClick: ss.event('here', {extract: ['target.value', 'clientX', 'clientY']})}, 'solsort HTML via ', ['em', 'React+JsonML']],
              ['input', {onKeyDown: ss.event('textChange', {extract: 'target.value'})}],
              ['react-star-rating:default', {name: 'hi', onRatingClick: ss.event('hello'), rating: 5}]
              ]);
      }
    });
    
# License

This software is copyrighted solsort.com ApS, and available under GPLv3, as well as proprietary license upon request.

Versions older than 10 years also fall into the public domain.

