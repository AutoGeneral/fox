const { readFileSync } = require('fs');

module.exports = configPath => {
	let config;

	try {
		config = readFileSync(configPath, 'utf8');
	} catch (e) {
		console.error(`Error! Cannot find config file. Existing now...`, e);
		process.exit(1);
	}

	return JSON.parse(config);
};
