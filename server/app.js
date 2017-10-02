const ROUTERS_PATH = `${__dirname}/routes`;
const DATASOURCES_PATH = `${__dirname}/datasources`;
const DETECTIONS_PATH = `${__dirname}/detections`;
const NOTIFICATIONS_PATH = `${__dirname}/notifications`;
const ERROR = require('./constants').ERROR;

const restify = require('restify');
const fs = require('fs');
const assert = require('assert');

const Scheduler = require('./core/scheduler');
const Database = require('./core/database');
const Sockets = require('./core/sockets');
const DetectionLoader = require('./core/detections.loader');
const MetricsLoader = require('./core/metrics.loader');
const DatasourcesLoader = require('./core/datasources.loader');
const NotificationsLoader = require('./core/notifications.loader');

class Application {
	/**
	 * @param {String} configName
	 */
	constructor(configName) {
		try {
			this._config = require(configName);
			this._config.debug = this._config.debug || {};
		} catch (ex) {
			console.error(
				`Error! Cannot find config file. Existing now...`,
				ex
			);
			process.exit(1);
		}

		this._logger = require('./core/logging')(this._config);
		Object.freeze(this._config);

		process.on('uncaughtException', err => {
			this._logger.error(err);
		});

		// Eureka
		require('./eureka').start(this._config);

		// Web server and sockets
		this._server = restify.createServer({});
		this.setupWebServer();
		this._sockets = new Sockets(this._server);

		// Database
		this._database = new Database(this._config);

		// Routing
		this.loadRouters(ROUTERS_PATH);

		// Metrics
		this._capabilities = this.loadCapabilities();
		this._metrics = this.loadMetrics();

		// Scheduler
		this._scheduler = new Scheduler(
			this._sockets,
			this._metrics,
			this._config.schedulerNotifications
		);
	}

	get config() {
		return this._config;
	}

	get server() {
		return this._server;
	}

	get capabilities() {
		return this._capabilities;
	}

	get metrics() {
		return this._metrics;
	}

	setupWebServer() {
		// Setup server
		this._server.use(restify.bodyParser({ mapParams: true }));
		this._server.use(restify.queryParser());

		// Global uncaughtException Error Handler
		this._server.on('uncaughtException', (req, res, route, error) => {
			this._logger.warn(
				'uncaughtException',
				route,
				error.stack.toString()
			);

			res.send(500, {
				error: ERROR.INTERNAL,
				status: 'error'
			});
		});

		this._server.use((req, res, next) => {
			// Add debug logger for /api/ endpoints
			if (/\/api\/.*/.test(req.url)) {
				this._logger.debug(`${req.method} ${req.url}`);
			}

			// Add CORS headers
			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Headers', 'X-Requested-With');

			return next();
		});
	}

	loadCapabilities() {
		const detectionsLoader = new DetectionLoader();
		const datasourcesLoader = new DatasourcesLoader(this._config);
		const notificationsLoader = new NotificationsLoader(this._config);

		const detections = detectionsLoader.load(DETECTIONS_PATH);
		const datasources = datasourcesLoader.load(DATASOURCES_PATH);
		const notifications = notificationsLoader.load(NOTIFICATIONS_PATH);

		return {
			detections,
			datasources,
			notifications
		};
	}

	loadMetrics() {
		assert(this._config.metrics, '"metrics" not defined in the config');
		const { detections, datasources, notifications } = this._capabilities;

		// Load Metrics
		const metricsLoader = new MetricsLoader(
			this._config.metrics,
			datasources,
			detections,
			notifications
		);
		return metricsLoader.load();
	}

	/**
	 * @description
	 * Loads and inits routers from the specified path
	 *
	 * @param {String} routersPath
	 */
	loadRouters(routersPath) {
		fs
			.readdirSync(routersPath)
			.filter(filename => /.*\.router\.js/.test(filename))
			.forEach(
				filename => new (require(`${ROUTERS_PATH}/${filename}`))(this)
			);
	}

	start() {
		this._scheduler.start();

		this._server.listen(
			this._config.server.port || 8080,
			this._config.server.host || 'localhost',
			() =>
				this._logger.info('Server is listening at %s', this._server.url)
		);
	}
}

module.exports = {
	Application,
	NOTIFICATIONS_PATH,
	DETECTIONS_PATH,
	ROUTERS_PATH,
	DATASOURCES_PATH
};
