<img src=https://solsort.solsort.com/icon.png width=96 height=96 align=right>

[![website](https://img.shields.io/badge/website-solsort.solsort.com-blue.svg)](https://solsort.solsort.com/) 
[![github](https://img.shields.io/badge/github-solsort/solsort-blue.svg)](https://github.com/solsort/solsort)
[![codeclimate](https://img.shields.io/codeclimate/github/solsort/solsort.svg)](https://codeclimate.com/github/solsort/solsort)
[![travis](https://img.shields.io/travis/solsort/solsort.svg)](https://travis-ci.org/solsort/solsort)
[![npm](https://img.shields.io/npm/v/solsort.svg)](https://www.npmjs.com/package/solsort)

# solsort development library

Library, primarily for use within appedit. Wraps 
[direape](https://appedit.solsort.com/?Read/js/gh/solsort/direape), 
[fri](https://appedit.solsort.com/?Read/js/gh/solsort/fri), 
and 
[reun](https://appedit.solsort.com/?Read/js/gh/solsort/reun), 
and adds extra functionality
    
    var solsort = exports; var ss = solsort;
    var da = require('direape'); da.testSuite('solsort');
    
## Examples
    
    da.test('examples', () => {
    
Render the following JSON-HTML
    
      ss.html(() => ['div', 
    
Make a heading, that counts the number of clicks
    
          ['h1.red', {onClick: ss.event('ss:click')}, 
          'Clicks: ', String(ss.getJS('click-count', 0))], 
    
Load a react component from npm
    
          ['react-star-rating:default', {name: 'hi', rating: 5}]
      ]);
    
Increase click-count in the application state, on click-event
    
      ss.handle('ss:click', () => 
          ss.setJS('click-count', ss.getJS('click-count', 0) + 1));
    
Set some styling
      if(ss.isBrowser()) {
        ss.loadStyle('myStyle', {'.red': {background: 'red'}});
      }
    });
    
## `direape`, `reun`, and `fri`. Export all symbols from these modules.

See <https://appedit.solsort.com/?Read/js/gh/solsort/direape> for details about `DireApe`.
    
    Object.assign(ss, da);
    da.ready(() => Object.assign(ss, da));
    
See <https://appedit.solsort.com/?Read/js/gh/solsort/reun> for details about `Reun`.
    
    var reun = require('reun');
    Object.assign(ss, reun);
    
See <https://appedit.solsort.com/?Read/js/gh/solsort/fri> for details about `FRI`.
    
    var fri = require('fri');
    Object.assign(ss, fri);
    
## API
### `html(JSON|str)`
    
    ss.html = (fn) => ss.rerun('ss:html', () => ss.setJS(['ui', 'html'], fn())); 
    
### `ss.event(name, opt)`
    
    ss.event = (name, opt) => ({solsortEvent: Object.assign({name: name, pid: da.pid}, opt)});
    
### `['ui','html']` rendered to DOM
    
    if(ss.isBrowser()) {
      require('react/dist/react.js');
      require('react-dom/dist/react-dom.js');
      ss.rerun('solsort:ui-renderer', () => {
        var html = ss.getJS(['ui', 'html']);
        var rootElem = document.getElementById('solsort-ui');
        if(!rootElem) {
          return;
        }
        if(typeof html === 'string') {
          rootElem.innerHTML = html;
        } else if(Array.isArray(html)) {
          ss.renderJsonml(html, rootElem);
        }
      });
    }
    
### `sleep(ms)`
    
    ss.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms || 0));
    
### `renderJsonml(jsonml, DOM_element)`
    
    ss.renderJsonml = (jsonml, elem) => ss.eval(() => {
      var dom = require('react-dom');
      dom.render(jsonml2react(jsonml), elem);
    });
    
### `loadStyle(style_element_id, json_css)`
    
    ss.loadStyle = (name, style) => {
      name = name + '-css';
      var elem = document.getElementById(name);
      if(!elem) {
        elem = document.createElement('style');
        elem.id = name;
        document.head.appendChild(elem);
      }
      var str = '';
      for(var selector in style) {
        str += selector + '{';
        for(var property in style[selector]) {
          var value = style[selector][property];
          if(typeof value === 'number') {
            value = value + 'px';
          }
          str += property.replace(/[A-Z]/g, s => '-' + s.toLowerCase());
          str += ':' + value + ';';
        }
        str += '}';
      }
      elem.innerHTML = str;
    };
    
    if(da.isBrowser()) {
      da.test('loadStyle', () => {
        var testStyle = {
          '.testStyle': { textColor: 'red', width: 100 },
          '.testStyle2': { }
        };
        return Promise.resolve(ss.loadStyle('testStyle', testStyle))
          .then(() => ss.sleep())
          .then(() => da.assertEquals(
                document.getElementById('testStyle-css').innerHTML,
                '.testStyle{text-color:red;width:100px;}.testStyle2{}'));
      });
    }
    
    
## Internal details
### `jsonml2react(jsonml)`
    
    function jsonml2react(o) {
      if(typeof o === 'string') {
        return o;
      } else if(Array.isArray(o)) {
        var react = require('react');
        var name = o[0];
        var node = document.createElement(o[0]);
        var params = o[1];
        var args = o.slice(2);
    
        if(typeof params !== 'object' || params.constructor !== Object) {
          params = {};
          args = o.slice(1);
        } else {
          params = Object.assign({}, params);
        }
    
        args = args.map(jsonml2react);
    
In addition to normal element names, we also support names like
'npmModule:exportedSymbol', which loads an npm-module with require.
Example: `['react-star-rating:default', {name: 'hi', rating: 5}]`
    
        if(name.indexOf(':') !== -1) {
          name = name.split(':');
          name = require(name[0])[name[1]];
    
        } else {
    
          name = name.replace(/[.][^.#]*/g, (cls) => {
            params.className = params.className || '';
            params.className += ' ' + cls.slice(1);
            return '';
          });
    
        }
    
        for(var k in params) {
          var v = params[k];
          if(k === 'class') {
            params.className += ' ' + v;
            params.className = params.className.trim();
            delete params.class;
          }
          if(isSolsortEvent(v)) {
            params[k] = makeSolsortCallback(v);
          }
        }
    
        return react.createElement.apply(react, [name, params].concat(args));
      } else {
        console.log('err', o, typeof o);
        throw 'unexpected type of parameter to jsonml2dom - ' + o;
      }
    
    }
    
### `isSolsortEvent(o)`
    
    function isSolsortEvent(o) {
      return o && typeof o === 'object' && o.solsortEvent && Object.keys(o).length === 1;
    }
    
### `makeSolsortCallback(o)`
    
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
              jsGetIn(e, extract[i]));
        }
        da.emit(o.pid, o.name, result, o.data);
      };
    }
    
### `jsSetIn(o, path, val)`
    
    function jsSetIn(o, path, val) {
      if(!path.length) { return val; }
      var k = path[0];
      try { o[k] = o[k]; } catch(e) { o = {}; }
      o[k] = jsSetIn(o[k], path.slice(1), val);
      return o;
    }
    
### `jsGetIn(o, path, defaultValue)`
    
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
    
## Main
    
    if(require.main === module) {
      ss.ready(() => {
        ss.runTests('solsort');
      });
    }
    
# License

This software is copyrighted solsort.com ApS, and available under GPLv3, as well as proprietary license upon request.

Versions older than 10 years also fall into the public domain.

    
