module.exports = function ( grunt ) {

  grunt.initConfig( {
    responsive_images: {
      myTask: {
        options: {
          sizes: [ {
            name: 'small',
            width: 400,
            quality: 80,
            suffix: '_1x'
          }, {
            name: 'large',
            width: 800,
            suffix: '_2x',
            quality: 80,
            rename: false
          }]
        },
        files: [ {
          expand: true,
          src: [ 'img/**/*.jpg' ],
          dest: 'dist/'
        }]
      }
    }
  } );

  grunt.loadNpmTasks( 'grunt-responsive-images' );

  grunt.registerTask( 'default', [ 'responsive_images' ] );

};