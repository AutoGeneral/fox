const logger = require('winston');
const ResponseHelper = require('../helpers/response');
const FIELDS_TO_MASK = [
	'accessKeyId',
	'secretAccessKey',
	'password',
	'accountId',
	'apiKey'
];

class StatusRouter {
	constructor(app) {
		this._config = app.config;

		/**
		 * @api {get} /api/status Status
		 * @apiName Status
		 * @apiGroup Information
		 * @apiVersion 1.0.0
		 */
		app.server.get('/api/status', this.status.bind(this));

		logger.debug('StatusRouter has been loaded');
	}

	status(req, res) {
		const sanitisedConfig = ResponseHelper.maskFields(
			JSON.parse(JSON.stringify(this._config)),
			FIELDS_TO_MASK
		);
		ResponseHelper.success(res, {
			status: 'ok',
			config: sanitisedConfig
		});
	}
}

module.exports = StatusRouter;
