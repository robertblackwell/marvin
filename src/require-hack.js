/*
* Must be included in a file at ./src level and must only be included once
*/
const path = require('path')
// let not_found = false
// let d = __dirname 
// while not_found
let projectRoot;
let projectSrc;

if( global._project_base_src === undefined ){
	projectSrc = global._project_base_src = __dirname;
	projectRoot = global._project_root = path.dirname(__dirname)
}

const projectRequire = function(p){
	return require(path.resolve(global._project_base_src, p))
}
module.exports = projectRequire
require('module').globalPaths.push(projectSrc)
return;
if( process.env.NODE_PATH === undefined)
	process.env.NODE_PATH =  projectSrc;
else
	process.env.NODE_PATH = process.env.NODE_PATH +":"+ projectSrc;


if( process.env.NODE_PATH === undefined)
	process.env.NODE_PATH =  projectSrc;
else
	process.env.NODE_PATH = process.env.NODE_PATH +":"+ projectSrc;
// require('module').Module._initPaths();