const logger = require('winston');
const ResponseHelper = require('../helpers/response');
const Database = require('../core/database');

class DatapointsRouter {
	constructor(app) {
		this._config = app.config;
		this._db = new Database();
		app.server.get('/api/points/:name', this.getPoints.bind(this));
		logger.debug('DatapointsRouter has been loaded');
	}

	getPoints(req, res) {
		const data = this._db.collection.points.findOne({
			name: req.params.name
		});
		ResponseHelper.success(res, {
			points: data ? data.values : [],
			name: data ? data.name : 'Unknown'
		});
	}
}

module.exports = DatapointsRouter;
