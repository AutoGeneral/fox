const DEFAULT_UPDATE_INTERVAL = 30 * 60 * 1000; // 30 min
const logger = require('winston');
const moment = require('moment');
const Database = require('./database');

class SchedulerNotifications {
	constructor(notification) {
		this._db = new Database();
		this._notification = notification;
	}

	start() {
		this.sendNotifications();
		setInterval(() => this.sendNotifications(), DEFAULT_UPDATE_INTERVAL);
	}

	sendNotifications() {
		const errors = this._db.collection.errors.find();
		if (!errors.length) {
			logger.debug('No notifications to send in scheduler queue');
			return;
		}

		let body = '<h2>Anomaly detection Scheduler messages</h2>';
		errors.forEach(error => {
			body += `
				<div>
					<h3>${moment(error.date).format('DD-MM-YYYY HH:MM')}</h3>
					<p>
						<pre>${JSON.stringify(error.error)}</pre>
					</p>
				</div>
			`;
		});

		this._notification
			.sendRaw('New Errors in Anomaly detection Scheduler', body)
			.then(() => {
				this._db.collection.errors.chain().find().remove();
			})
			.catch(err => {
				logger.error(err);
			});
	}
}

module.exports = SchedulerNotifications;
