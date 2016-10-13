/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['middleware/errorHandler.js']) {
  _$jscoverage['middleware/errorHandler.js'] = [];
  _$jscoverage['middleware/errorHandler.js'][12] = 0;
  _$jscoverage['middleware/errorHandler.js'][17] = 0;
  _$jscoverage['middleware/errorHandler.js'][44] = 0;
  _$jscoverage['middleware/errorHandler.js'][45] = 0;
  _$jscoverage['middleware/errorHandler.js'][46] = 0;
  _$jscoverage['middleware/errorHandler.js'][47] = 0;
  _$jscoverage['middleware/errorHandler.js'][48] = 0;
  _$jscoverage['middleware/errorHandler.js'][49] = 0;
  _$jscoverage['middleware/errorHandler.js'][51] = 0;
  _$jscoverage['middleware/errorHandler.js'][52] = 0;
  _$jscoverage['middleware/errorHandler.js'][53] = 0;
  _$jscoverage['middleware/errorHandler.js'][54] = 0;
  _$jscoverage['middleware/errorHandler.js'][56] = 0;
  _$jscoverage['middleware/errorHandler.js'][57] = 0;
  _$jscoverage['middleware/errorHandler.js'][63] = 0;
  _$jscoverage['middleware/errorHandler.js'][64] = 0;
  _$jscoverage['middleware/errorHandler.js'][68] = 0;
  _$jscoverage['middleware/errorHandler.js'][69] = 0;
  _$jscoverage['middleware/errorHandler.js'][70] = 0;
  _$jscoverage['middleware/errorHandler.js'][71] = 0;
  _$jscoverage['middleware/errorHandler.js'][72] = 0;
  _$jscoverage['middleware/errorHandler.js'][73] = 0;
  _$jscoverage['middleware/errorHandler.js'][76] = 0;
  _$jscoverage['middleware/errorHandler.js'][77] = 0;
  _$jscoverage['middleware/errorHandler.js'][86] = 0;
}
_$jscoverage['middleware/errorHandler.js'][12]++;
var utils = require("../utils"), fs = require("fs");
_$jscoverage['middleware/errorHandler.js'][17]++;
var env = process.env.NODE_ENV || "development";
_$jscoverage['middleware/errorHandler.js'][44]++;
exports = module.exports = (function errorHandler() {
  _$jscoverage['middleware/errorHandler.js'][45]++;
  return (function errorHandler(err, req, res, next) {
  _$jscoverage['middleware/errorHandler.js'][46]++;
  if (err.status) {
    _$jscoverage['middleware/errorHandler.js'][46]++;
    res.statusCode = err.status;
  }
  _$jscoverage['middleware/errorHandler.js'][47]++;
  if (res.statusCode < 400) {
    _$jscoverage['middleware/errorHandler.js'][47]++;
    res.statusCode = 500;
  }
  _$jscoverage['middleware/errorHandler.js'][48]++;
  if ("test" != env) {
    _$jscoverage['middleware/errorHandler.js'][48]++;
    console.error(err.stack);
  }
  _$jscoverage['middleware/errorHandler.js'][49]++;
  var accept = req.headers.accept || "";
  _$jscoverage['middleware/errorHandler.js'][51]++;
  if (~ accept.indexOf("html")) {
    _$jscoverage['middleware/errorHandler.js'][52]++;
    fs.readFile(__dirname + "/../public/style.css", "utf8", (function (e, style) {
  _$jscoverage['middleware/errorHandler.js'][53]++;
  fs.readFile(__dirname + "/../public/error.html", "utf8", (function (e, html) {
  _$jscoverage['middleware/errorHandler.js'][54]++;
  var stack = (err.stack || "").split("\n").slice(1).map((function (v) {
  _$jscoverage['middleware/errorHandler.js'][56]++;
  return "<li>" + v + "</li>";
})).join("");
  _$jscoverage['middleware/errorHandler.js'][57]++;
  html = html.replace("{style}", style).replace("{stack}", stack).replace("{title}", exports.title).replace("{statusCode}", res.statusCode).replace(/\{error\}/g, utils.escape(err.toString()));
  _$jscoverage['middleware/errorHandler.js'][63]++;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  _$jscoverage['middleware/errorHandler.js'][64]++;
  res.end(html);
}));
}));
  }
  else {
    _$jscoverage['middleware/errorHandler.js'][68]++;
    if (~ accept.indexOf("json")) {
      _$jscoverage['middleware/errorHandler.js'][69]++;
      var error = {message: err.message, stack: err.stack};
      _$jscoverage['middleware/errorHandler.js'][70]++;
      for (var prop in err) {
        _$jscoverage['middleware/errorHandler.js'][70]++;
        error[prop] = err[prop];
}
      _$jscoverage['middleware/errorHandler.js'][71]++;
      var json = JSON.stringify({error: error});
      _$jscoverage['middleware/errorHandler.js'][72]++;
      res.setHeader("Content-Type", "application/json");
      _$jscoverage['middleware/errorHandler.js'][73]++;
      res.end(json);
    }
    else {
      _$jscoverage['middleware/errorHandler.js'][76]++;
      res.writeHead(res.statusCode, {"Content-Type": "text/plain"});
      _$jscoverage['middleware/errorHandler.js'][77]++;
      res.end(err.stack);
    }
  }
});
});
_$jscoverage['middleware/errorHandler.js'][86]++;
exports.title = "Connect";
_$jscoverage['middleware/errorHandler.js'].source = ["/*!"," * Connect - errorHandler"," * Copyright(c) 2010 Sencha Inc."," * Copyright(c) 2011 TJ Holowaychuk"," * MIT Licensed"," */","","/**"," * Module dependencies."," */","","var utils = require('../utils')","  , fs = require('fs');","","// environment","","var env = process.env.NODE_ENV || 'development';","","/**"," * Error handler:"," *"," * Development error handler, providing stack traces"," * and error message responses for requests accepting text, html,"," * or json."," *"," * Text:"," *"," *   By default, and when _text/plain_ is accepted a simple stack trace"," *   or error message will be returned."," *"," * JSON:"," *"," *   When _application/json_ is accepted, connect will respond with"," *   an object in the form of `{ \"error\": error }`."," *"," * HTML:"," *"," *   When accepted connect will output a nice html stack trace."," *"," * @return {Function}"," * @api public"," */","","exports = module.exports = function errorHandler(){","  return function errorHandler(err, req, res, next){","    if (err.status) res.statusCode = err.status;","    if (res.statusCode &lt; 400) res.statusCode = 500;","    if ('test' != env) console.error(err.stack);","    var accept = req.headers.accept || '';","    // html","    if (~accept.indexOf('html')) {","      fs.readFile(__dirname + '/../public/style.css', 'utf8', function(e, style){","        fs.readFile(__dirname + '/../public/error.html', 'utf8', function(e, html){","          var stack = (err.stack || '')","            .split('\\n').slice(1)","            .map(function(v){ return '&lt;li&gt;' + v + '&lt;/li&gt;'; }).join('');","            html = html","              .replace('{style}', style)","              .replace('{stack}', stack)","              .replace('{title}', exports.title)","              .replace('{statusCode}', res.statusCode)","              .replace(/\\{error\\}/g, utils.escape(err.toString()));","            res.setHeader('Content-Type', 'text/html; charset=utf-8');","            res.end(html);","        });","      });","    // json","    } else if (~accept.indexOf('json')) {","      var error = { message: err.message, stack: err.stack };","      for (var prop in err) error[prop] = err[prop];","      var json = JSON.stringify({ error: error });","      res.setHeader('Content-Type', 'application/json');","      res.end(json);","    // plain text","    } else {","      res.writeHead(res.statusCode, { 'Content-Type': 'text/plain' });","      res.end(err.stack);","    }","  };","};","","/**"," * Template title, framework authors may override this value."," */","","exports.title = 'Connect';"];
