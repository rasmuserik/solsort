// <img src=https://solsort.solsort.com/icon.png width=96 height=96 align=right>
//
// [![website](https://img.shields.io/badge/website-solsort.solsort.com-blue.svg)](https://solsort.solsort.com/) 
// [![github](https://img.shields.io/badge/github-solsort/solsort-blue.svg)](https://github.com/solsort/solsort)
// [![codeclimate](https://img.shields.io/codeclimate/github/solsort/solsort.svg)](https://codeclimate.com/github/solsort/solsort)
// [![travis](https://img.shields.io/travis/solsort/solsort.svg)](https://travis-ci.org/solsort/solsort)
// [![npm](https://img.shields.io/npm/v/solsort.svg)](https://www.npmjs.com/package/solsort)
//
// # solsort development library
//
// *Unstable - under development - do not use it yet*
// 
// Library, primarily for use within appedit. Wraps direape and reun, and adds extra functionality
// # Examples
//
// Make the app consist of a button, and replace it with text when clicked.
//
// ```javascript
// solsort.handle('hello', () => solsort.html('bye');
// solsort.html(`<button onclick=#{solsort.htmlEvent('hello')}>Hi</button>`);
// ```
//
// # Dependencies
//
var reun = require('reun@0.1');
var da = require('direape@0.1');
var ss = exports;

// # DireApe passthrough

ss.handle = da.handle;
ss.jsonify = da._jsonify;
ss.slice = da._slice;

// # UI
//

ss.htmlEvent = function htmlEvent(name, propagate) {
  return `require('${module.uri}').domEventHandler('${da.pid}','${name}'` +
      `,'${propagate}')(arguments[0])`;
};
ss.html = function html(h) {
  da.setJS(['ui', 'html'], h);
};

var eventWhitelist =
['timeStamp', 'target', 'touches', 'clientX', 'clientY',
  'charCode', 'keyCode', 'key', 'code', 'location',
 'altKey', 'shiftKey', 'ctrlKey', 'metaKey', 'repeat']
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

// ## Autorender ['ui','html']
//
// Automatically render `['ui', 'html']` to `#solsort-ui` element, when running in the main threa.

if(typeof document !== 'undefined') {
  da.reaction('solsort:ui-renderer', () => {
    var rootElem = document.getElementById('solsort-ui');
    if(!rootElem) {
      return;
    }
    var html = da.getJS(['ui', 'html']);
    if(typeof html === 'string') {
      rootElem.innerHTML = html;
    } else if(Array.isArray(html)) {
      html = jsonml2dom(html);
      while(rootElem.firstChild) {
        rootElem.firstChild.remove();
      }
      rootElem.appendChild(html);
    }
  });
}

// ## jsonml2dom
//
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

// # Main function for testing

ss.main = () => {
  //da.setJS(['ui', 'html'], ['h1', 'hello ', ['em', 'world!']]);
  ss.handle('hello', o => console.log(o));
  ss.html(`<input onkeydown=${ss.htmlEvent('hello')}>`);
};

// # License
// 
// This software is copyrighted solsort.com ApS, and available under GPLv3, as well as proprietary license upon request.
// 
// Versions older than 10 years also fall into the public domain.
// 
