const path = require('path')
const testDirPath = __dirname
const srcDirPath = path.resolve(__dirname, "../src/")
console.log(process.env.NODE_PATH)
// const pp = path.resolve(process.env.NODE_PATH)
process.env.NODE_PATH = path.resolve("../src/") //+":"+ pp; //process.env.NODE_PATH//srcDirPath 
// global.NODE_PATH = srcDirPath +":"+ testDirPath
console.log(process.env.NODE_PATH)