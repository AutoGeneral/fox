const DATASOURCE_NAME = 'NewRelic';
const TYPES = {
	server: 'servers',
	application: 'applications'
};
const DEFAULT_PARAMS_SERVER = {
	value: 'average_value',
	period: 60,
	timeframe: '1 day'
};

const AbstractDatasource = require('./abstract.datasource');
const request = require('request-promise');
const logger = require('winston');
const assert = require('assert');

class NewRelicDatasource extends AbstractDatasource {
	constructor(params) {
		super();
		assert(
			params.apiKey,
			'"apiKey" not defined, those are required params for NewRelic datasource'
		);
		this.apiKey = params.apiKey;
	}

	static get name() {
		return DATASOURCE_NAME;
	}

	sendRequest(options) {
		assert(
			options,
			'options param required for NewRelicDatasource.sendRequest'
		);

		const opts = Object.assign({}, DEFAULT_PARAMS_SERVER, options);
		const params = [];
		const types = TYPES[opts.type];
		const timeframe = NewRelicDatasource.getDatesFromTimeframe(
			opts.timeframe,
			opts.timeframeShift
		);

		if (!types)
			throw new Error(
				`Unknown type '${opts.type}' in New Relic datasource`
			);

		params.push(
			[...opts.metric].map(metric => `names[]=${metric}`).join('&')
		);
		params.push(`period=${opts.period}`);
		params.push(`from=${timeframe.StartTime.toISOString()}`);
		params.push(`to=${timeframe.EndTime.toISOString()}`);

		const uri = `https://api.newrelic.com/v2/${types}/${opts.id}/metrics/data.json?${params.join(
			'&'
		)}`;

		logger.debug(`Sending request to New Relic "${uri}"`);
		return new Promise((resolve, reject) => {
			request({
				uri,
				method: 'GET',
				headers: { 'X-Api-Key': this.apiKey },
				json: true
			})
				.then(data => {
					if (
						!data.metric_data ||
						!data.metric_data.metrics_found ||
						data.metric_data.metrics_found.length === 0
					) {
						throw new Error(
							`Metric not found for ${options.metric} in New Relic datasource`
						);
					}

					// Iterate through the first metric
					const dataPoints = data.metric_data.metrics[0].timeslices.map(
						datapoint => ({
							value: datapoint.values[options.value],
							timestamp: new Date(datapoint.to).getTime()
						})
					);

					// We will iterate through all other metrics if there are more of them
					// and combine (add) their values with the existing datapoints
					if (data.metric_data.metrics.length > 1) {
						for (
							let i = 1;
							i < data.metric_data.metrics.length;
							i++
						) {
							for (let j = 0; j < dataPoints.length; j++) {
								const dataPoint =
									data.metric_data.metrics[i].timeslices[j];
								if (!dataPoint) break;
								dataPoints[j].value +=
									dataPoint.values[options.value];
							}
						}
					}
					resolve(dataPoints);
				})
				.catch(err => {
					reject(err);
				});
		});
	}
}

module.exports = NewRelicDatasource;
