const path = require('path');
const Application = require('./server/app').Application;

const defaultConfigFile = `${__dirname}/config/default.json`;

/**
 * Envionment based config file.
 *
 * Matches `./config/${ENVIRONMENT}.json`
 *
 * $ set -lx ENVIRONMENT uat; node server
 */
const shouldUseEnvVarConfigFile = !!process.env.ENVIRONMENT;

/**
 * Argument based config file.
 *
 * Matches `./config/${--config= <something> }.json`
 *
 * $ node server --config=uat
 */
const shouldUseArgConfigFile = process.argv.some(val => /--config/.test(val));

const configPath = () => {
	switch (true) {
		case shouldUseArgConfigFile:
			return path.join(
				__dirname,
				'config',
				process.argv
					.filter(val => /--config/.test(val))
					.map(val => val.split('=')[1])[0]
			);

		case shouldUseEnvVarConfigFile:
			return path.join(
				__dirname,
				'config',
				process.env.ENVIRONMENT.toLowerCase() + '.json'
			);

		default:
			return defaultConfigFile;
	}
};

const config = require('./server/configResolver')(path.normalize(configPath()));

const FoxApp = new Application(config);
FoxApp.start();

if (config.eureka) {
	require('./server/eureka').start(config);
}
