/* automatically generated by JSCoverage - do not edit */
if (typeof _$jscoverage === 'undefined') _$jscoverage = {};
if (! _$jscoverage['middleware/bodyParser.js']) {
  _$jscoverage['middleware/bodyParser.js'] = [];
  _$jscoverage['middleware/bodyParser.js'][13] = 0;
  _$jscoverage['middleware/bodyParser.js'][47] = 0;
  _$jscoverage['middleware/bodyParser.js'][48] = 0;
  _$jscoverage['middleware/bodyParser.js'][52] = 0;
  _$jscoverage['middleware/bodyParser.js'][53] = 0;
  _$jscoverage['middleware/bodyParser.js'][54] = 0;
  _$jscoverage['middleware/bodyParser.js'][55] = 0;
  _$jscoverage['middleware/bodyParser.js'][56] = 0;
  _$jscoverage['middleware/bodyParser.js'][57] = 0;
}
_$jscoverage['middleware/bodyParser.js'][13]++;
var multipart = require("./multipart"), urlencoded = require("./urlencoded"), json = require("./json");
_$jscoverage['middleware/bodyParser.js'][47]++;
exports = module.exports = (function bodyParser(options) {
  _$jscoverage['middleware/bodyParser.js'][48]++;
  var _urlencoded = urlencoded(options), _multipart = multipart(options), _json = json(options);
  _$jscoverage['middleware/bodyParser.js'][52]++;
  return (function bodyParser(req, res, next) {
  _$jscoverage['middleware/bodyParser.js'][53]++;
  _json(req, res, (function (err) {
  _$jscoverage['middleware/bodyParser.js'][54]++;
  if (err) {
    _$jscoverage['middleware/bodyParser.js'][54]++;
    return next(err);
  }
  _$jscoverage['middleware/bodyParser.js'][55]++;
  _urlencoded(req, res, (function (err) {
  _$jscoverage['middleware/bodyParser.js'][56]++;
  if (err) {
    _$jscoverage['middleware/bodyParser.js'][56]++;
    return next(err);
  }
  _$jscoverage['middleware/bodyParser.js'][57]++;
  _multipart(req, res, next);
}));
}));
});
});
_$jscoverage['middleware/bodyParser.js'].source = ["","/*!"," * Connect - bodyParser"," * Copyright(c) 2010 Sencha Inc."," * Copyright(c) 2011 TJ Holowaychuk"," * MIT Licensed"," */","","/**"," * Module dependencies."," */","","var multipart = require('./multipart')","  , urlencoded = require('./urlencoded')","  , json = require('./json');","","/**"," * Body parser:"," * "," *   Parse request bodies, supports _application/json_,"," *   _application/x-www-form-urlencoded_, and _multipart/form-data_."," *"," *   This is equivalent to: "," *"," *     app.use(connect.json());"," *     app.use(connect.urlencoded());"," *     app.use(connect.multipart());"," *"," * Examples:"," *"," *      connect()"," *        .use(connect.bodyParser())"," *        .use(function(req, res) {"," *          res.end('viewing user ' + req.body.user.name);"," *        });"," *"," *      $ curl -d 'user[name]=tj' http://local/"," *      $ curl -d '{\"user\":{\"name\":\"tj\"}}' -H \"Content-Type: application/json\" http://local/"," *"," *  View [json](json.html), [urlencoded](urlencoded.html), and [multipart](multipart.html) for more info."," *"," * @param {Object} options"," * @return {Function}"," * @api public"," */","","exports = module.exports = function bodyParser(options){","  var _urlencoded = urlencoded(options)","    , _multipart = multipart(options)","    , _json = json(options);","","  return function bodyParser(req, res, next) {","    _json(req, res, function(err){","      if (err) return next(err);","      _urlencoded(req, res, function(err){","        if (err) return next(err);","        _multipart(req, res, next);","      });","    });","  }","};"];