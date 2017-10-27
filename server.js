const path = require('path');
const Application = require('./server/app').Application;

let configPath = `${__dirname}/config/default.json`;
if (process.argv.some(val => /--config/.test(val))) {
	configPath = path.join(
		__dirname,
		'config',
		process.argv
			.filter(val => /--config/.test(val))
			.map(val => val.split('=')[1])[0]
	);
} else if (process.env.ENVIRONMENT) {
	configPath = path.join(
		__dirname,
		'config',
		process.env.ENVIRONMENT.toLowerCase() + '.json'
	);
}

configPath = path.normalize(configPath);

const FoxApp = new Application(configPath);
FoxApp.start();
