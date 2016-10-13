/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['middleware/session/store.js']) {
  _$jscoverage['middleware/session/store.js'] = [];
  _$jscoverage['middleware/session/store.js'][13] = 0;
  _$jscoverage['middleware/session/store.js'][23] = 0;
  _$jscoverage['middleware/session/store.js'][29] = 0;
  _$jscoverage['middleware/session/store.js'][39] = 0;
  _$jscoverage['middleware/session/store.js'][40] = 0;
  _$jscoverage['middleware/session/store.js'][41] = 0;
  _$jscoverage['middleware/session/store.js'][42] = 0;
  _$jscoverage['middleware/session/store.js'][43] = 0;
  _$jscoverage['middleware/session/store.js'][56] = 0;
  _$jscoverage['middleware/session/store.js'][57] = 0;
  _$jscoverage['middleware/session/store.js'][58] = 0;
  _$jscoverage['middleware/session/store.js'][59] = 0;
  _$jscoverage['middleware/session/store.js'][60] = 0;
  _$jscoverage['middleware/session/store.js'][61] = 0;
  _$jscoverage['middleware/session/store.js'][62] = 0;
  _$jscoverage['middleware/session/store.js'][63] = 0;
  _$jscoverage['middleware/session/store.js'][76] = 0;
  _$jscoverage['middleware/session/store.js'][77] = 0;
  _$jscoverage['middleware/session/store.js'][79] = 0;
  _$jscoverage['middleware/session/store.js'][80] = 0;
  _$jscoverage['middleware/session/store.js'][81] = 0;
  _$jscoverage['middleware/session/store.js'][82] = 0;
  _$jscoverage['middleware/session/store.js'][83] = 0;
}
_$jscoverage['middleware/session/store.js'][13]++;
var EventEmitter = require("events").EventEmitter, Session = require("./session"), Cookie = require("./cookie");
_$jscoverage['middleware/session/store.js'][23]++;
var Store = module.exports = (function Store(options) {
});
_$jscoverage['middleware/session/store.js'][29]++;
Store.prototype.__proto__ = EventEmitter.prototype;
_$jscoverage['middleware/session/store.js'][39]++;
Store.prototype.regenerate = (function (req, fn) {
  _$jscoverage['middleware/session/store.js'][40]++;
  var self = this;
  _$jscoverage['middleware/session/store.js'][41]++;
  this.destroy(req.sessionID, (function (err) {
  _$jscoverage['middleware/session/store.js'][42]++;
  self.generate(req);
  _$jscoverage['middleware/session/store.js'][43]++;
  fn(err);
}));
});
_$jscoverage['middleware/session/store.js'][56]++;
Store.prototype.load = (function (sid, fn) {
  _$jscoverage['middleware/session/store.js'][57]++;
  var self = this;
  _$jscoverage['middleware/session/store.js'][58]++;
  this.get(sid, (function (err, sess) {
  _$jscoverage['middleware/session/store.js'][59]++;
  if (err) {
    _$jscoverage['middleware/session/store.js'][59]++;
    return fn(err);
  }
  _$jscoverage['middleware/session/store.js'][60]++;
  if (! sess) {
    _$jscoverage['middleware/session/store.js'][60]++;
    return fn();
  }
  _$jscoverage['middleware/session/store.js'][61]++;
  var req = {sessionID: sid, sessionStore: self};
  _$jscoverage['middleware/session/store.js'][62]++;
  sess = self.createSession(req, sess);
  _$jscoverage['middleware/session/store.js'][63]++;
  fn(null, sess);
}));
});
_$jscoverage['middleware/session/store.js'][76]++;
Store.prototype.createSession = (function (req, sess) {
  _$jscoverage['middleware/session/store.js'][77]++;
  var expires = sess.cookie.expires, orig = sess.cookie.originalMaxAge;
  _$jscoverage['middleware/session/store.js'][79]++;
  sess.cookie = new Cookie(sess.cookie);
  _$jscoverage['middleware/session/store.js'][80]++;
  if ("string" == typeof expires) {
    _$jscoverage['middleware/session/store.js'][80]++;
    sess.cookie.expires = new Date(expires);
  }
  _$jscoverage['middleware/session/store.js'][81]++;
  sess.cookie.originalMaxAge = orig;
  _$jscoverage['middleware/session/store.js'][82]++;
  req.session = new Session(req, sess);
  _$jscoverage['middleware/session/store.js'][83]++;
  return req.session;
});
_$jscoverage['middleware/session/store.js'].source = ["","/*!"," * Connect - session - Store"," * Copyright(c) 2010 Sencha Inc."," * Copyright(c) 2011 TJ Holowaychuk"," * MIT Licensed"," */","","/**"," * Module dependencies."," */","","var EventEmitter = require('events').EventEmitter","  , Session = require('./session')","  , Cookie = require('./cookie');","","/**"," * Initialize abstract `Store`."," *"," * @api private"," */","","var Store = module.exports = function Store(options){};","","/**"," * Inherit from `EventEmitter.prototype`."," */","","Store.prototype.__proto__ = EventEmitter.prototype;","","/**"," * Re-generate the given requests's session."," *"," * @param {IncomingRequest} req"," * @return {Function} fn"," * @api public"," */","","Store.prototype.regenerate = function(req, fn){","  var self = this;","  this.destroy(req.sessionID, function(err){","    self.generate(req);","    fn(err);","  });","};","","/**"," * Load a `Session` instance via the given `sid`"," * and invoke the callback `fn(err, sess)`."," *"," * @param {String} sid"," * @param {Function} fn"," * @api public"," */","","Store.prototype.load = function(sid, fn){","  var self = this;","  this.get(sid, function(err, sess){","    if (err) return fn(err);","    if (!sess) return fn();","    var req = { sessionID: sid, sessionStore: self };","    sess = self.createSession(req, sess);","    fn(null, sess);","  });","};","","/**"," * Create session from JSON `sess` data."," *"," * @param {IncomingRequest} req"," * @param {Object} sess"," * @return {Session}"," * @api private"," */","","Store.prototype.createSession = function(req, sess){","  var expires = sess.cookie.expires","    , orig = sess.cookie.originalMaxAge;","  sess.cookie = new Cookie(sess.cookie);","  if ('string' == typeof expires) sess.cookie.expires = new Date(expires);","  sess.cookie.originalMaxAge = orig;","  req.session = new Session(req, sess);","  return req.session;","};"];
