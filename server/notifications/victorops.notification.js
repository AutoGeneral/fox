const NOTIFICATION_NAME = 'VictorOpsNotification';
const URL = 'https://alert.victorops.com/integrations/generic/20131114/alert';

const logger = require('winston');
const assert = require('assert');
const request = require('request-promise');

class VictorOpsNotification {
	constructor(params, baseUrl) {
		assert(
			params && params.hashKey && params.routingKey,
			'VictorOpsNotification constructor expected "hashKey" and "routingKey" params'
		);

		this._url = [URL, params.hashKey, params.routingKey].join('/');
		this._routingKey = params.routingKey;
		this._baseUrl = baseUrl;
	}

	static get name() {
		return NOTIFICATION_NAME;
	}

	send(metricName, setsOfDatapoints) {
		logger.debug(
			`Sending VictorOpsNotification notification to Routing Key "${this
				._routingKey}"`
		);

		const dataPoint = setsOfDatapoints[setsOfDatapoints.length - 1];
		request({
			url: this._url,
			method: 'POST',
			body: {
				entity_id: `${metricName}:${dataPoint.timestamp}`,
				state_start_time: dataPoint.timestamp,
				message_type: 'WARNING',
				state_message: `Anomaly detected in metric ${metricName} - value ${dataPoint.value}`,
				monitoring_tool: 'Fox'
			},
			json: true
		})
			.then(response => {
				logger.debug(
					`VictorOpsNotification notification sent. Routing Key: "${this
						._routingKey}", entity ID: ${response.entity_id}`
				);
			})
			.catch(error => logger.error(error));
	}
}

module.exports = VictorOpsNotification;
