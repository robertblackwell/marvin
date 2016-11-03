#!/usr/bin/env node

"use strict";

var path = require('path');
var fs = require('fs');
var libPath = path.resolve(path.join(__dirname, "../src/"))

var main = require(path.join(libPath, '/marvin.js'))



main()