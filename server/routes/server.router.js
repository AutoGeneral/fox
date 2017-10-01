const logger = require('winston');
const ResponseHelper = require('../helpers/response');

class ServerRouter {
	constructor(app) {
		this._app = app;

		app.server.get(
			'/api/server/capabilities',
			this.getCapabilities.bind(this)
		);

		logger.debug('ServerRouter has been loaded');
	}

	static describeCapabilities(capabilities) {
		return [...capabilities.keys()].map(name => ({
			name,
			parameters: capabilities.get(name).constructor.describe
				? capabilities.get(name).constructor.describe()
				: {}
		}));
	}

	getCapabilities(req, res) {
		const {
			detections,
			datasources,
			notifications
		} = this._app.capabilities;
		const metrics = this._app.metrics;

		ResponseHelper.success(res, {
			detections: ServerRouter.describeCapabilities(detections),
			datasources: ServerRouter.describeCapabilities(datasources),
			notifications: ServerRouter.describeCapabilities(notifications),
			metrics: metrics.map(metric =>
				Object.assign({}, { name: metric.name }, metric.config)
			)
		});
	}
}

module.exports = ServerRouter;
