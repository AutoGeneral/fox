module.exports.tasks = {

	watch: {
		sass: {
			files: ['<%= settings.webAssets %>/**/*.scss'],
			tasks: ['sass']
		},
		index: {
			files: ['<%= settings.webAssets %>/**/*.html'],
			tasks: ['copy']
		}
	}
};
