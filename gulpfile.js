//
// Gulp file for rtw skin of whiteacorn
//
const path      = require('path');
// const webpack = require('webpack')
// const webpack_stream = require('webpack-stream')
const gutil     = require('gulp-util')
const gulp      = require('gulp-help')(require('gulp'));
const less      = require('gulp-less');
const cleancss  = require('gulp-clean-css')
const print     = require('gulp-print');
const changed   = require('gulp-changed');
const util      = require('gulp-util');
const debug     = require("gulp-debug");
const concat    = require('gulp-concat');
const rimraf    = require('gulp-rimraf');
const gulpif    = require('gulp-if');
const rebaseUrls = require('gulp-css-rebase-urls');
const gulp_util = require('gulp-util')
const del       = require('del');
const vinylPaths = require('vinyl-paths');

require('shelljs/global');

////////////////////////////////////////////////////////////////////////////////////////////
// config constants for this file
////////////////////////////////////////////////////////////////////////////////////////////

// place for less source code
const less_dir = path.resolve(__dirname, "less")

//place for css source code and derived css files
const css_dir = path.resolve(__dirname, "css")

// place to put final build products to be used in live site
const dist_dir = path.resolve(__dirname, "dist")

// Place to put temporary build products
const build_dir = path.resolve(__dirname, "build")

//
//css that has to be pulled from other places
//
const libs_css = [
]
const libs_combined_css ="libs_combined.css"

const node_module_css = [
    ]
const node_modules_combined_css = 'node_modules_combined.css'    

const bower_components_css = [
	]
const bower_components_combined_css = 'bower_combined.css'

//
//
//
const combined_css = 'combined.css'
//
// The css file that the less files all compile into
//
const compiled_less = 'master.css'
//
// less master file that imports all other less files - compile only this one
//
const master_less = 'less/master.less'
const photon_css = 'photon/css/photon.css'
const css_to_bundle = [
	path.resolve(css_dir, photon_css),
	path.resolve(css_dir, bower_components_combined_css), 
	path.resolve(css_dir, node_modules_combined_css),
	path.resolve(css_dir, libs_combined_css),
	path.resolve(css_dir, compiled_less)
]
////////////////////////////////////////////////////////////////////////////////////////////
// task to manage project mode/environment
////////////////////////////////////////////////////////////////////////////////////////////
const project_mode = 'dev'

const determineMode = function(){
	if(gulp_util.env.prod === true){
		project_mode = "prod"
	}
	gulp_util.log("Build for Mode(prod/dev) : " + (project_mode))
}
determineMode()

const isProd = function(){
	return (project_mode == "prod")
}

////////////////////////////////////////////////////////////////////////////////////////////
// helpers 
////////////////////////////////////////////////////////////////////////////////////////////


/*
** fudge to get a gulp run
*/
gulp.exec = function () {
  const tasks = arguments.length ? arguments : ['default'];
  this.start.apply(this, tasks);
};
const pprint = print(function(filePath){
    return "cleaned: " + filePath
})
const vdel = vinylPaths(del);


////////////////////////////////////////////////////////////////////////////////////////////
// default task - does it for prod only
////////////////////////////////////////////////////////////////////////////////////////////
gulp.task('default', 'Build everything  ',['bundle-js', 'bundle-css'], function(){
});


////////////////////////////////////////////////////////////////////////////////////////////
// install 
////////////////////////////////////////////////////////////////////////////////////////////

gulp.task('install',"Install npm modules and do what ever 'special processing' is required", function(){
	exec('npm install')
})

////////////////////////////////////////////////////////////////////////////////////////////
// build 
////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////
// watch 
////////////////////////////////////////////////////////////////////////////////////////////
gulp.task('watch', 'watch for changes in less, css,js files', ['watch-css', 'watch-js'], function(){})


////////////////////////////////////////////////////////////////////////////////////
// clean 	- tasks to delete things
//       	- all contents of ./build
//			- all contents of ./css 
//			- all contents of ./dist
//
////////////////////////////////////////////////////////////////////////////////////

gulp.task("clean", "Deletes all dependencies and build products", [], function(){

    gulp.src([
            css_dir+"/*", 
            dist_dir+"/*",
            build_dir+"/*"
        ]).pipe(pprint).pipe(vdel);
})



////////////////////////////////////////////////////////////////////////////////////////////
// less/css - tasks 
////////////////////////////////////////////////////////////////////////////////////////////
//
// bundle css files for production
//
gulp.task('bundle-css', 'Bundle ALL css into one combined.css file', 
	[ 'node_modules_css','bower_css', 'libs_css', 'less'], 
	function(){
	gulp_util.log("bundle-css start")

    util.log(' bundle css files ');    
    gulp.src(css_to_bundle)
        .pipe(print())
        .pipe(concat(combined_css))
		.pipe(gulpif(isProd(), cleancss({compatibility: 'ie8'})))
        .pipe(gulp.dest(dist_dir))
        .pipe(print());
});
gulp.task('bundle-css-simple', 'Bundle ALL css into one combined.css file but fires NO other tasks', 
    [], 
    function(){
	gulp_util.log("bundle-css-simple start")

    util.log(' bundle css files ');    
    gulp.src(css_to_bundle)
        .pipe(print())
        .pipe(concat(combined_css))
        .pipe(gulpif(isProd(), cleancss()))
        .pipe(gulp.dest(dist_dir))
        .pipe(print()).on('error', function(a,b){
        	console.log(["bundle-css-simple error",a,b])
        });
});

////////////////////////////////////////////////////////////////////////////////////////////
// sub task of css - concat css files from libs
////////////////////////////////////////////////////////////////////////////////////////////
gulp.task('libs_css', 'Concatenate required node_module css files into one minified file ', [], function(){
    
    gulp.src(libs_css)
        .pipe(print())        
//         .pipe(rebaseUrls({
//             root: "css/",
//             }
//         ))             
        .pipe(concat(libs_combined_css))
        .pipe(gulp.dest(css_dir))
        .pipe(print());
})
////////////////////////////////////////////////////////////////////////////////////////////
// sub task of css - concat css files from node_modules
////////////////////////////////////////////////////////////////////////////////////////////
gulp.task('node_modules_css', 'Concatenate required node_module css files into one minified file ', function(){
    
    gulp.src(node_module_css)
        .pipe(print())        
//         .pipe(rebaseUrls({
//             root: "css/",
//             }
//         ))             
        .pipe(concat(node_modules_combined_css))
        .pipe(gulp.dest(css_dir))
        .pipe(print());
})
////////////////////////////////////////////////////////////////////////////////////////////
// sub task of css - concat css files from bower_components
////////////////////////////////////////////////////////////////////////////////////////////
gulp.task('bower_css', 'Concatenate required node_module css files into one minified file ', function(){    
    gulp.src(bower_components_css)
        .pipe(print())        
//         .pipe(rebaseUrls({
//             root: "css/",
//             }
//         ))             
        .pipe(concat(bower_components_combined_css))
        .pipe(gulp.dest(css_dir))
        .pipe(print());
})

////////////////////////////////////////////////////////////////////////////////////////////
// subtask of css Compile site specific less files AND BOOTSTRAP  less files into master.css 
////////////////////////////////////////////////////////////////////////////////////////////
gulp.task('less', 'Compile master.less into master.css', function () {
  return gulp.src(["./less/master.less"])
  	.pipe(print())
	.pipe(less({ paths: [ 
		'less',
		// 'node_modules/bootstrap/less',
		// 'node_modules/bootstrap/less/mixins',
		// 'node_modules/js-breakpoints',
	 ] }).on('error', function(e){
		console.log(["less error: ", e]);
	} ))
	.pipe(print(function(filepath) {
      return "built: " + filepath;
    }))
    .pipe(gulp.dest(css_dir));
});

////////////////////////////////////////////////////////////////////////////////////////////
// watch task - watch for changes in js, less, css 
//
// NOTE : only in dev mode. In prod mode use the default task
//
////////////////////////////////////////////////////////////////////////////////////////////

// Watch Files For Changes
gulp.task('watch-css', 'watch js , less, css files and on change invoke correct task', ['bundle-css'], function() {
    
	
    const css_watch_list = [].concat(
        libs_css,
        bower_components_css,
        node_module_css,
        ["less/**/*"]
    )
	
	gulp.watch(css_watch_list, ['bundle-css']).on('error', function(err, stats){
		console.log('XXXXXXXXXXX')
		console.log([err, stats])
	})
	return;
    gulp.watch(libs_css, ['libs_css']); 
    gulp.watch(bower_components_css, ['bower_css']); 
    gulp.watch(node_module_css, ['node_modules_css']); 
    gulp.watch(['less/bootstrap-custom/**/*'], ['bootstrap-custom'])
    gulp.watch([
        'less/*.less',
        // 'node_modules/js-breakpoints/**/*.less',

    ], ['less']) 

    gulp.watch([
            libs_combined_css,
            bower_components_combined_css,
            node_modules_combined_css,
            path.resolve(css_dir, "master.css"),
        ], ['bundle-css-simple'])

});

