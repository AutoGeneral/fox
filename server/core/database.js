const DB_NAME = 'loki.json';
const COLLECTION = {
	POINTS: 'points',
	NOTIFICATIONS: 'notifications',
	ERRORS: 'errors'
};

const loki = require('lokijs');
let instance = null;

/**
 * @singleton
 */
class Database {
	constructor(config) {
		if (instance) return instance;
		instance = this;

		this._db = new loki(DB_NAME);
		this._config = config;

		this._collection = Object.keys(COLLECTION).reduce(
			(result, current) =>
				Object.assign(result, {
					[COLLECTION[current]]: this._db.addCollection(
						COLLECTION[current]
					)
				}),
			{}
		);
	}

	get collection() {
		return this._collection;
	}
}

module.exports = Database;
