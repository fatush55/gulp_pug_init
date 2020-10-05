// Gulp
const { src, dest } = require('gulp');
const gulp = require('gulp');
// Plugins Root
const server = require('browser-sync').create();
const file_include = require('gulp-file-include');
const del = require('del');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
// Plugins Css
const sass = require('gulp-sass');
const auto_prefix = require('gulp-autoprefixer');
const group_media = require('gulp-group-css-media-queries'  );
const clean_css = require('gulp-clean-css');
// Plugins Js
const uglify = require('gulp-uglify-es').default;
const babel = require('gulp-babel');
// Images
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const webpHtml = require('gulp-webp-html');
const webpCss = require('gulp-webp-css');
const svgSprite = require('gulp-svg-sprite');
// Font
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fonter = require('gulp-fonter');
// Paths
const project_folder = 'build';
const source_folder = 'src';
const fs = require('fs');
const path = {
    build: {
        html: `${project_folder}/`,
        css: `${project_folder}/css/`,
        js: `${project_folder}/js/`,
        img: `${project_folder}/img/`,
        video: `${project_folder}/video/`,
        fonts: `${project_folder}/fonts/`,
    },
    src: {
        html: [`${source_folder}/*.html`, `!${source_folder}/_*.html`],
        css: `${source_folder}/scss/index.scss`,
        js: `${source_folder}/js/index.js`,
        img: `${source_folder}/img/*.{jpg,png,svg,gif,ico,webp}`,
        video: `${source_folder}/video/*.{mp4`,
        fonts: `${source_folder}/fonts/*.ttf`,
    },
    watch: {
        html: `${source_folder}/**/*.html`,
        css: `${source_folder}/scss/**/*.scss`,
        js: `${source_folder}/js/**/*.js`,
        img: `${source_folder}/img/*.{jpg,png,svg,gif,ico,webp}`,
        video: `${source_folder}/video/*.{mp4}`,
        fonts: `${source_folder}/fonts/*.ttf`,
    },
    clear: `./${project_folder}/`
};


function html() {
    return src(path.src.html)
        .pipe(file_include())
        .pipe(webpHtml())
        .pipe(dest(path.build.html))
        .pipe(server.stream())
}

function css() {
    return src(path.src.css)
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: "expanded"
        })).on('error', sass.logError)
        .pipe(group_media())
        .pipe(auto_prefix({
            overrideBrowserslist: ["last 5 versions"],
            cascade: true,
        }))
        .pipe(webpCss())
        .pipe(dest(path.build.css))
        .pipe(clean_css({compatibility: 'ie8'}))
        .pipe(rename({
            extname: ".min.css"
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(dest(path.build.css))
        .pipe(server.stream())
}

function js() {
    return src(path.src.js)
        .pipe(sourcemaps.init())
        .pipe(file_include())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(rename({
            extname: ".min.js"
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(dest(path.build.js))
        .pipe(server.stream())
}

function img() {
    return src(path.src.img)

        .pipe(webp({
            quality: 70 // %
        }))
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            interlaced: true,
            optimizationLevel: 3 // 0 to 7
        }))
        .pipe(dest(path.build.img))
        .pipe(server.stream())
}

function font() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}

gulp.task('svgSprite', () => {
    return gulp.src([`${source_folder}/icon/*.svg`])
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../icon/sprite', // sprite file name
                    example: true,
                }
            }
        }))
        .pipe(dest(path.build.img))
})

function fontsStyle(params) {

    let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
    if (file_content == '') {
        fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() { }

gulp.task('otf2ttf', () => {
    return gulp.src([`${source_folder}/fonts/*.otf`])
        .pipe(fonter({
            formats: ['ttf'],
        }))
        .pipe(dest(`${source_folder}/fonts/`))
})



function watchFile(params) {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], img);
    gulp.watch([path.watch.img], font);
}

function clear(params) {
    return del(path.clear);
}

function browserSync(params) {
    server.init({
        server: {
            baseDir: path.clear
        },
        port: 3000,
        notify: false,
    });
}

const build = gulp.series(clear, gulp.parallel(css, html, js, img, font), fontsStyle);
const watch = gulp.parallel(build, watchFile, browserSync);

exports.fontsStyle = fontsStyle;
exports.font = font;
exports.img = img;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
