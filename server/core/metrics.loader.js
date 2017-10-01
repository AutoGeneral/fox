const assert = require('assert');
const logger = require('winston');

class MetricLoader {
	/**
	 *
	 * @param metricsConfig
	 * @param {Map<String, Object>} dataSources
	 * @param {Map<String, Object>} detections
	 * @param {Map<String, Object>} notifications
	 */
	constructor(metricsConfig, dataSources, detections, notifications) {
		assert(
			metricsConfig && dataSources && detections,
			'MetricLoader constructor requires metricsConfig, dataSources, detections and notifications to be passed'
		);
		this._metricsConfig = metricsConfig;
		this._dataSources = dataSources;
		this._detections = detections;
		this._notifications = notifications;
	}

	static getDetectionObject(detection) {
		const tmp = detection.split('.');
		const [detectionName, detectionFunction] = tmp;
		return {
			name: detectionName,
			func: detectionFunction
		};
	}

	load() {
		const metrics = [];
		Object.keys(this._metricsConfig).forEach(metricName => {
			try {
				metrics.push(
					this.initMetric(metricName, this._metricsConfig[metricName])
				);
			} catch (e) {
				logger.warn(`Can't load metric ${metricName}`, e);
			}
		});
		return metrics;
	}

	initMetric(metricName, metricConfig) {
		const metric = {
			name: metricName
		};

		const detection = MetricLoader.getDetectionObject(
			metricConfig.detection
		);

		assert(
			metricConfig.dataSource && metricConfig.detection,
			`${JSON.stringify(metricConfig)} - invalid configuration`
		);
		assert(
			this._dataSources.has(metricConfig.dataSource),
			`Unknown datasource ${metricConfig.dataSource}`
		);
		assert(
			this._detections.has(detection.name),
			`Unknown detection ${detection.name}`
		);

		// Get notification defined in metric settings or use random one (as order is not guaranteed in Map)
		// from the list of available notifications
		metric.notification = this._notifications.get(
			metricConfig.notification || [...this._notifications.keys()][0]
		);

		metric.getData = () =>
			this._dataSources
				.get(metricConfig.dataSource)
				.getData(metricConfig.dataSourceQueries);

		metric.config = metricConfig;
		metric.updateInterval = metricConfig.updateInterval;
		metric.detection = new (this._detections.get(detection.name))(
			metricConfig.detectionParams || {}
		);
		metric.detectionFunc = metric.detection[detection.func];
		assert(
			typeof metric.detectionFunc === 'function',
			`Detection function ${detection.func} not found in detection ${detection.name} object`
		);

		logger.debug(
			`Metric configured "${metric.name}": notifications - ${metric.notification
				? metric.notification.constructor.name
				: 'none'}` +
				`, update interval - ${metric.updateInterval / 1000} secs`
		);

		return metric;
	}
}

module.exports = MetricLoader;
