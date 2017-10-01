const STATIC_FOLDER = `${__dirname}/../../dist`;
const restify = require('restify');
const logger = require('winston');

class StaticRouter {
	constructor(app) {
		this._config = app.config;

		app.server.get(
			/.*\.(gif|png|css|js|jpg|eot|woff|html|ttf|woff2|svg)/,
			restify.serveStatic({
				directory: STATIC_FOLDER
			})
		);

		app.server.get(
			/^(?!\/api).*/,
			restify.serveStatic({
				directory: STATIC_FOLDER,
				default: 'index.html'
			})
		);

		logger.debug('StaticRouter has been loaded');
	}
}

module.exports = StaticRouter;
