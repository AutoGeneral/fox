module.exports.tasks = {

	browserify: {
		dist: {
			options: {
				transform: ['babelify'],
				watch: true
			},
			files: {
				'<%= settings.webDist %>/scripts/app.js': '<%= settings.webSrc %>/app.js'
			}
		}
	}
};
