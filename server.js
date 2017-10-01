const path = require('path');
const Application = require('./server/app').Application;
const Eureka = require('./server/eureka');

let configPath = `${__dirname}/config/default.json`;
if (process.env.config) {
	configPath = process.env.config.replace('./', __dirname + '/');
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

Eureka.start(configPath);
