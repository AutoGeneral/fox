module.exports.tasks = {

	cssmin: {
		target: {
			files: {
				'<%= settings.webDist %>/styles/main.css': ['<%= settings.webDist %>/styles/main.css']
			}
		}
	}
};
