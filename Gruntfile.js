module.exports = function(grunt) {
grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
        options: {
            browserifyOptions: {
                noParse: [
                    'node_modules/jquery/release/jquery.js',
                    'node_modules/bluebird/js/browser/bluebird.js',
                    'node_modules/underscore/underscore.js'
                ],
                ignoreGlobals: true,
                transform: ['babelify'],
                debug: true
            },
            watch: grunt.option('watchify'),
            keepAlive: false
        },
        main: {
            options: {
                require: ['babel/polyfill']
            },
            files: {
                'public/app.js': ['src/dev.js', 'src/main.js'],
            }
        },
        release: {
            options: {
                require: ['babel/polyfill']
            },
            browserifyOptions: {
                debug: false,
                ignoreGlobals: false,
                transform: ['babelify']
            },
            files: {
                'release/app.js': ['src/release.js', 'src/main.js'],
                'release/worker.js': ['src/worker.js']
            }
        },
        worker: {
            files: {
                'public/worker.js': ['src/worker.js']
            }
        },
        tests: {
            files: {
                'public/test/tests.js': ['src/dev.js', 'src/test-helpers.js', 'src/**/*-tests.js'],
            }
        }
    },
    sass: {
        options:{
            sourceMap: true
        },
        main: {
            files: {
                'public/app.css': 'style/main.scss'
            }
        }
    },
    autoprefixer: {
        options: {
            map: true
        },
        main: {
            files: {
                'public/app.css': 'public/app.css'
            }
        }
    },
    jade: {
        main: {
            files: [
                {expand: true, dest:'public/', cwd: 'templates/', src:'**/*.jade', filter: 'isFile', ext: '.html'}
            ]
        }
    },
    shell: {
        optimize_clut: {
            command: 'mogrify -format png -depth 8 public/clut/*.png && optipng public/clut/*.png'
        },
        export_logo: {
            command: [
                'inkscape gfx/logo.svg --export-png=public/logo-32.png -w 32 -h 32',
                'inkscape gfx/logo.svg --export-png=public/logo-64.png -w 64 -h 64',
                'inkscape gfx/logo.svg --export-png=public/logo-128.png -w 128 -h 128',
                'inkscape gfx/logo.svg --export-png=public/logo-180.png -w 180 -h 180',
                'inkscape gfx/logo.svg --export-png=public/logo-192.png -w 192 -h 192',
                'inkscape gfx/logo.svg --export-png=public/logo-256.png -w 256 -h 256',
                'inkscape gfx/logo.svg --export-png=public/logo-512.png -w 512 -h 512',
                'convert public/logo-32.png public/favicon.ico'
            ].join(' && ')
        }
    },
    connect: {
        server: {
            options: {
                hostname: '*',
                base: 'public',
                //keepalive: true,
                livereload: true,
                //debug: true,
                open: grunt.option('open')
            }
        }
    },
    rsync: {
        options: {
            recursive: true
        },
        release: {
            options: {
                src: 'release/',
                dest: '/var/www/static/film-emulator',
                host: '29a.ch',
                port: '22',
                deleteAll: true,
                dryRun: false
            }
        }
    },
    copy: {
        release: {
            files: [
                {expand: true, dest:'release/', cwd: 'public/', src:'**', filter: 'isFile'}
            ]
        }
    },
    cssmin: {
        release: {
            files: {'release/app.css':'release/app.css'}
        }
    },
    uglify: {
        options: {
            report: 'min',
            //sourceMap: true,
            //mangle: false,
            //compress: false,
            //beautify: true
        },
        release: {
            files: {
                'release/app.js': 'release/app.js',
                'release/worker.js': 'release/worker.js'
            }
        }
    },
    compress: {
        release: {
            options: {
                mode: 'gzip'
            },
            files: [
                {
                    expand: true,
                    cwd: 'release/',
                    src: ['**/*.css', '**/*.js', '**/*.html', '**/*.json'],
                    dest: 'release/',
                    rename: function(dest, src) { return dest + src + '.gz'; }
                }
            ]
        }
    },
    watch: {
        static: {
            files: ['**/*.css', '**/*.js', '**/*.html'],
            options: {
                livereload: true,
                cwd: 'public/'
            }
        },
        logo: {
            files: ['gfx/logo.svg'],
            tasks: ['shell:export_logo']
        },
        browserifymain: {
            files: ['src/**/*.js', 'src/*.js', 'public/clut/index.json'],
            tasks: ['browserify:main', 'browserify:tests'],
            options: {
                //spawn: true
            }
        },
        browserifyworker: {
            files: ['src/worker.js', 'src/image-processing.js'],
            tasks: ['browserify:worker']
        },
        sassmain: {
            files: ['style/*'],
            tasks: ['sass:main', 'autoprefixer:main']
        },
        templates: {
            files: ['templates/**/*.jade'],
            tasks: ['jade:main']
        }
    }
});
if(grunt.option('watchify')){
    console.log('running in watchify mode');
    grunt.registerTask('default', ['build', 'connect:server', 'watch:static', 'watch:sassmain']);
}
else {
    grunt.registerTask('default', ['build', 'connect:server', 'watch']);
}

grunt.registerTask('build', ['browserify:main', 'browserify:worker', 'browserify:tests', 'sass:main', 'autoprefixer:main', 'jade:main', 'shell:export_logo']);
grunt.registerTask('log', function(){
    console.log(grunt.filerev.summary);
});

grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-contrib-connect');

grunt.loadNpmTasks('grunt-sass');
grunt.loadNpmTasks('grunt-autoprefixer');

grunt.loadNpmTasks('grunt-browserify');

grunt.loadNpmTasks('grunt-contrib-jade');

grunt.registerTask('release', ['sass:main', 'jade:main', 'autoprefixer:main', 'copy:release', 'cssmin:release', 'browserify:release', 'uglify:release', 'compress:release', 'rsync:release']);

grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-contrib-copy');
grunt.loadNpmTasks('grunt-contrib-cssmin');
grunt.loadNpmTasks('grunt-shell');
grunt.loadNpmTasks('grunt-contrib-compress');
grunt.loadNpmTasks('grunt-rsync');
grunt.loadTasks('tasks');
};
