module.exports = function (grunt) {

	require('load-grunt-tasks')(grunt);
	require('time-grunt')(grunt);

	const options = {
		config: {
			src: 'grunt-tasks/*.js'
		},
		settings: {
			webSrc: 'web/scripts',
			webAssets: 'web/resources',
			webDist: 'dist',
			tmp: '.tmp'
		}
	};

	const configs = require('load-grunt-configs')(grunt, options);

	grunt.initConfig(configs);

	grunt.registerTask('listen', [
		'sass',
		'copy',
		'browserify',
		'watch'
	]);

	grunt.registerTask('serve', [
		'clean',
		'sass',
		'copy',
		'browserify',
		'develop',
		'watch'
	]);

	grunt.registerTask('build', [
		'clean',
		'sass',
		'copy',
		'browserify',
		'cssmin',
		'uglify'
	]);
};
