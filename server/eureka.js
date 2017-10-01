const Eureka = require('eureka-js-client').Eureka,
	os = require('os'),
	name = require('../package.json').name,
	address = require('ip').address();

const serviceUrls = {
	default: []
};

const version = require('../package.json').version.split('.');
const appName = `${process.env.APPLICATION_NAME ||
	name}-V${version[0]}.${version[1]}`;

module.exports = {
	start(configPath) {
		const config = require(configPath);

		if (!config.eureka) {
			return;
		}

		Object.keys(config.eureka.serviceUrls).forEach(function(key) {
			var value = config.eureka.serviceUrls[key];
			serviceUrls['default'] = serviceUrls['default'].concat(value);
			serviceUrls[key] = (serviceUrls[key] || []).concat(value);
		});

		const client = new Eureka({
			logger: require('winston'),
			instance: {
				instanceId: os.hostname(),
				app: appName,
				hostName: address,
				ipAddr: address,
				port: {
					$: config.server.port,
					'@enabled': true
				},
				vipAddress: appName,
				dataCenterInfo: {
					'@class':
						'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
					name: 'MyOwn'
				}
			},
			eureka: {
				preferSameZone: true,
				availabilityZones: {
					'ap-southeast-2': ['ap-southeast-2a', 'ap-southeast-2b']
				},
				serviceUrls: serviceUrls
			}
		});

		client.start();
	}
};
