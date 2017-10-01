const DEFAULT_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 min

const logger = require('winston');
const assert = require('assert');
const Database = require('./database');
const SchedulerNotifications = require('./scheduler-notifications');
const NotificationsLoader = require('./notifications.loader');

class Scheduler {
	constructor(sockets, metrics, notificationConfiguration) {
		this._db = new Database();
		this._sockets = sockets;
		this._metrics = metrics;
		this._notificationScheduler = null;

		if (
			notificationConfiguration &&
			Object.keys(notificationConfiguration).length
		) {
			const notificationName = notificationConfiguration.name;
			const NOTIFICATIONS_PATH = require('./../app').NOTIFICATIONS_PATH;

			assert(
				notificationName,
				'No "name" defined for Scheduler notification'
			);

			this._notificationScheduler = new SchedulerNotifications(
				NotificationsLoader.loadByName(
					NOTIFICATIONS_PATH,
					notificationName,
					notificationConfiguration
				)
			);
			this._notificationScheduler.start();
		}
	}

	start() {
		this._metrics.forEach(metric => {
			this.updateMetric(metric, false);
			setInterval(() => {
				this.updateMetric(metric, true);
			}, metric.updateInterval || DEFAULT_UPDATE_INTERVAL);
		});
	}

	updateMetric(metric, isNotificationEnabled) {
		// dataPoints : Array<Array<Point>>
		// where Point : Object
		//               - value
		//               - timestamp
		metric
			.getData()
			.then(dataPoints => {
				this._db.collection.points
					.chain()
					.find({ name: metric.name })
					.remove();

				const processedDataPoints =
					(dataPoints[0] || []).length === 0
						? []
						: metric.detectionFunc.call(
								metric.detection,
								dataPoints
							);

				this._db.collection.points.insert({
					name: metric.name,
					values: processedDataPoints
				});

				if (isNotificationEnabled)
					this.notify(metric, processedDataPoints);

				metric.lastUpdated = Math.max.apply(
					Math,
					processedDataPoints.map(i => i.timestamp)
				);

				this._sockets.emit('update', {
					name: metric.name,
					data: processedDataPoints
				});
			})
			.catch(err => {
				logger.error(`${metric.name} processing error`, err);
				this._db.collection.errors.insert({
					date: Date.now(),
					error: err
				});
			});
	}

	notify(metric, dataPoints) {
		const notifications = this.getSetsForNotifications(
			metric.lastUpdated,
			dataPoints
		);

		function sendNotification(sets) {
			if (
				metric.notification &&
				typeof metric.notification.send === 'function'
			) {
				metric.notification.send(metric.name, sets);
			} else {
				logger.warn(
					`Anomaly for metric ${metric.name} has been found but system failed to send a notification`
				);
			}
		}

		if (metric.config.notificationConfig) {
			// Clean up expired notifications.
			this._db.collection.notifications
				.chain()
				.find({
					metric: metric.name,
					ttl: { $lt: Date.now() }
				})
				.remove();

			if (notifications.length > 0) {
				// Insert the current event as a "potential" notification
				this._db.collection.notifications.insert({
					metric: metric.name,
					// Setting the TTL to date now plus the interval (so date now, plus 10 mins)
					ttl:
						Date.now() +
						(0 + metric.config.notificationConfig.intervalSeconds) *
							1000,
					created: metric.lastUpdated
				});
			}

			const lokiEvents = this._db.collection.notifications.chain().find({
				metric: metric.name,
				ttl: { $gte: Date.now() }
			});

			/*
			Then we do a loki search to see where the ttl is still greater than or equal than the current date, hence a
				current active notification to take into consideration.
			 */
			const countOfEvents = lokiEvents.data().length;

			if (countOfEvents >= 0 + metric.config.notificationConfig.count) {
				sendNotification(
					this.getSetsForNotifications(
						Math.min.apply(
							Math,
							lokiEvents.data().map(x => x.created)
						),
						dataPoints
					)
				);

				// Remove the events that were fired.
				lokiEvents.remove();
			}
		} else {
			notifications.length > 0 && sendNotification(notifications);
		}
	}

	getSetsForNotifications(lastUpdated, dataPoints) {
		const sets = [];
		const itemsInSet = 5;
		dataPoints.forEach((point, i) => {
			if (!point.isEvent) return;
			if (point.timestamp <= lastUpdated) return;
			sets.push(
				dataPoints
					.slice(
						i - itemsInSet + 1 > 0 ? i - itemsInSet + 1 : 0,
						i + 1
					)
					.map(item => {
						return {
							value: item.value,
							timestamp: item.timestamp,
							isEvent: item.isEvent
						};
					})
			);
		});
		return sets;
	}
}

module.exports = Scheduler;
