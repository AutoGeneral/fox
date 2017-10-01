const DATASOURCE_NAME = 'NewRelicInsights';

const AbstractDatasource = require('./abstract.datasource');
const request = require('request-promise');
const logger = require('winston');
const assert = require('assert');

class NewRelicInsightsDatasource extends AbstractDatasource {
	constructor(params) {
		super();
		assert(
			params.accountId && params.apiKey,
			'"accountId" and "apiKey" not defined, those are required params for NewRelic datasource'
		);

		this.accountId = params.accountId;
		this.apiKey = params.apiKey;
	}

	static get name() {
		return DATASOURCE_NAME;
	}

	static process(timeSeries, dataPoints) {
		let value;
		const key =
			typeof timeSeries.results[0].score === 'undefined'
				? Object.keys(timeSeries.results[0])[0]
				: 'score';
		if (typeof timeSeries.results[0][key] === 'object') {
			const secondKey = Object.keys(timeSeries.results[0][key])[0];
			value = timeSeries.results[0][key][secondKey];
		} else {
			value = timeSeries.results[0][key];
		}

		dataPoints.push({
			value,
			timestamp: timeSeries.beginTimeSeconds * 1000
		});
	}

	sendRequest(query) {
		assert(
			query,
			'query param required for NewRelicInsightsDatasource.sendRequest'
		);
		const uri = `https://insights-api.newrelic.com/v1/accounts/${this
			.accountId}/query?nrql=${encodeURIComponent(query)}`;
		logger.debug(`Sending request to New Relic "${uri}"`);

		return new Promise((resolve, reject) => {
			request({
				uri,
				method: 'GET',
				headers: { 'X-Query-Key': this.apiKey },
				json: true
			})
				.then(data => {
					const dataPoints = [];
					if (data.facets) {
						data.facets.forEach(facet => {
							facet.timeSeries.forEach(timeSeries => {
								NewRelicInsightsDatasource.process(
									timeSeries,
									dataPoints
								);
							});
						});
					} else {
						data.timeSeries.forEach(timeSeries => {
							NewRelicInsightsDatasource.process(
								timeSeries,
								dataPoints
							);
						});
					}
					resolve(dataPoints);
				})
				.catch(err => {
					reject(err);
				});
		});
	}
}

module.exports = NewRelicInsightsDatasource;
