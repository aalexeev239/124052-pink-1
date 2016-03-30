"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass");
var plumber = require("gulp-plumber");
var clean = require("gulp-contrib-clean");

var postcss = require("gulp-postcss");
var assets  = require("postcss-assets");
var autoprefixer = require("autoprefixer");
var reporter     = require("postcss-reporter");
var syntax_scss  = require("postcss-scss");
var stylelint    = require("stylelint");

var server = require("browser-sync");
var notify = require("gulp-notify");
var jade = require("gulp-jade");
var fs = require("fs");
var foldero = require("foldero");
var dataPath = "jade/_data/";

var uglify = require("gulp-uglify");
var svg_sprite = require("gulp-svg-sprite");


// clean
gulp.task("clean", function() {
	gulp.src("build")
		.pipe(clean());
});


// jade
gulp.task("jade", function() {
  var siteData = {};
  if (fs.existsSync(dataPath)) {
    siteData = foldero(dataPath, {
      recurse: true,
      whitelist: "(.*/)*.+\.(json)$",
      loader: function loadAsString(file) {
        var json = {};
        try {
          json = JSON.parse(fs.readFileSync(file, "utf8"));
        } catch (e) {
          console.log("Error Parsing JSON file: " + file);
          console.log("==== Details Below ====");
          console.log(e);
        }
        return json;
      }
    });
  }

  return gulp.src("jade/_pages/*.jade")
    .pipe(plumber({
      errorHandler: notify.onError("Error:  <%= error.message %>")
    }))
    .pipe(jade({
      locals: {
        site: {
          data: siteData
        }
      },
      pretty: true
    }))
    .pipe(gulp.dest("build/"))
    .pipe(server.reload({
      stream: true
    }))
    .pipe(notify({
      message: "jade up!",
      sound: "Pop"
    }));
});

// js
gulp.task("js", function() {
  gulp.src("js/**/*.js")
  .pipe(plumber({
    errorHandler: notify.onError("Error: <%= error.message %>")
  }))
  .pipe(uglify())
  .pipe(gulp.dest("build/js"))
  .pipe(server.reload({
    stream: true
  }))
  .pipe(notify({
    message:"JS complite: <%= file.relative %>!",
    sound: "Pop"
  }))
});


// img
gulp.task("img", function() {
  gulp.src(["img/*.svg", "img/**/*.{jpg,png}"])
  .pipe(gulp.dest("build/img"))
  .pipe(server.reload({
    stream: true
  }))
});


// svg
gulp.task("svg", function() {
  return gulp.src("img/svg-sprite/*.svg")
  .pipe(svg_sprite({
    mode: {
      symbol: {
        dest: ".",
        dimensions: "%s",
        sprite: "build/img/svg-sprite.svg",
        example: false,
        render: {scss: {dest: "sass/_global/svg-sprite.scss"}}
      }
    },
    svg: {
      xmlDeclaration: false,
      doctypeDeclaration: false
    }
  }))
  .pipe(gulp.dest("./"))
  .pipe(server.reload({
    stream: true
  }))
});


// font
gulp.task("font", function() {
  gulp.src("fonts/**/*.{woff,woff2}")
  .pipe(gulp.dest("build/fonts"))
  .pipe(server.reload({
    stream: true
  }))
});


// sass
gulp.task("styletest", function() {
  var processors = [
    stylelint(),
    reporter({
      throwError: true
    })
  ];

  return gulp.src(["!sass/_global/svg-sprite.scss", "sass/**/*.scss"])
    .pipe(plumber())
    .pipe(postcss(processors, {syntax: syntax_scss}))
});

gulp.task("style", ["styletest"], function() {
  gulp.src("sass/style.scss")
    .pipe(plumber({
      errorHandler: notify.onError("Error:  <%= error.message %>")
    }))
    .pipe(sass())
    .pipe(postcss([
      autoprefixer({
        browsers: [
          "last 1 version",
          "last 2 Chrome versions",
          "last 2 Firefox versions",
          "last 2 Opera versions",
          "last 2 Edge versions"
        ]
      }),
			assets({
	      loadPaths: ["img"]
	    })
    ]))
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream())
    .pipe(notify({
      message: "Style up!",
      sound: "Pop"
    }));
});

// build
gulp.task("build", ["clean", "jade", "js", "img", "svg", "font", "style"], function() {
  gulp.src("/")
  .pipe(gulp.dest("build"))
});


// serve
gulp.task("serve", ["jade", "js", "img", "svg", "font", "style"], function() {
  server.init({
    server: {
      baseDir: "build/"
    },
    notify: false,
    open: true,
    ui: false
  });

  gulp.watch("js/**/*.js", ["js", server.reload]);
  gulp.watch(["img/*.svg", "img/**/*.{jpg,png}"], ["svg"]);
  gulp.watch("img/**/*.{jpg,png}", ["img"]);
  gulp.watch("fonts/**/*{woff,woff2}", ["font"]);
  gulp.watch("sass/**/*.{scss,sass}", ["style", server.stream]);
  gulp.watch("jade/**/*", ["jade", server.reload]);
});