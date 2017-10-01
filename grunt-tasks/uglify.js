module.exports.tasks = {

	uglify: {
		options: {
			mangle: false
		},
		target: {
			files: {
				'<%= settings.webDist %>/scripts/app.js': '<%= settings.webDist %>/scripts/app.js',
				'<%= settings.webDist %>/scripts/vendor.js': '<%= settings.webDist %>/scripts/vendor.js'
			}
		}
	}
};
