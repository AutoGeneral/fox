const fs = require('fs');
const assert = require('assert');
const logger = require('winston');

class NotificationsLoader {
	constructor(config) {
		this._notificationsConfig =
			config && config.notifications ? config.notifications : {};
		this._baseUrl = config && config.baseUrl ? config.baseUrl : '';

		if (!this._baseUrl)
			logger.warn(
				'baseUrl config param is not defined and will be ignored in notifications'
			);
	}

	/**
	 * @static
	 * @description
	 * Searches for notification class by class name in the list of available notifications
	 * and creates a new notification object using passed parameters
	 *
	 * @param {String} path Path to notifications classes folder (*.notification.js file pattern)
	 * @param {String} name Name of the notification class to load
	 * @param {Object} [params] Object with init params that will be passed to notification constructor
	 */
	static loadByName(path, name, params) {
		const filenames = fs
			.readdirSync(path)
			.filter(filename => /.*\.notification(s?)\.js/.test(filename))
			.filter(filename => {
				const NotificationClass = require(`${path}/${filename}`);
				assert(
					NotificationClass.name,
					`"name" static property must be defined for notification in ${filename}`
				);
				return NotificationClass.name === name;
			});

		assert(
			filenames.length,
			`Notification "${name}" not found in path "${path}"`
		);
		if (filenames.length > 1) {
			logger.warn(
				`Found ${filenames.length} notifications with name "${name}". Using the first one...`
			);
		}

		const Notification = require(`${path}/${filenames[0]}`);
		return new Notification(params);
	}

	/**
	 * @description
	 * Load notifications classes from path
	 *
	 * @param {String} path
	 * @return {Map<String, Object>} Map with Notification objects where key - class name
	 */
	load(path) {
		const notifications = new Map();
		fs
			.readdirSync(path)
			.filter(filename => /.*\.notification(s?)\.js/.test(filename))
			.forEach(filename => {
				const Notification = require(`${path}/${filename}`);
				assert(
					Notification.name,
					`"name" static property must be defined for notification in ${filename}`
				);

				if (!this._notificationsConfig[Notification.name]) {
					logger.info(
						`Configuration for "${Notification.name}" notification not found in config. Skipping...`
					);
					return;
				}

				const notification = new Notification(
					this._notificationsConfig[Notification.name],
					this._baseUrl
				);
				assert(
					notification.send,
					`"send" function must be defined for notification in ${filename}`
				);

				notifications.set(Notification.name, notification);
				logger.info(
					`Notification "${Notification.name}" has been loaded`
				);
			});

		return notifications;
	}
}

module.exports = NotificationsLoader;
