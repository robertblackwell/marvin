// const hack = require("../src/require-hack")
const path = require('path')
require('module').globalPaths.push(path.resolve("../src"))
// console.log(process.env)
console.log(require('module').globalPaths)
const mv = require("viewer/views/main-view.js")
// console.log(global)
console.log(mv)