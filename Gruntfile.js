module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
  'gh-pages': {
    options: {
      base: 'platforms/browser/www/'
    },
    src: ['**']
  }
  });

  grunt.loadNpmTasks('grunt-gh-pages');


  // Default task(s).
  grunt.registerTask('default', ['gh-pages']);

};