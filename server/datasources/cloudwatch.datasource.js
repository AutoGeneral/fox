const DATASOURCE_NAME = 'Cloudwatch';
const DEFAULT_REGION = 'us-west-1';
const DEFAULT_PARAMS = {
	Period: 300,
	Statistics: ['Sum'],
	Unit: 'Count'
};

const AbstractDatasource = require('./abstract.datasource');
const logger = require('winston');
const assert = require('assert');
const AWS = require('aws-sdk');
const proxy = require('proxy-agent');

class CloudwatchDatasource extends AbstractDatasource {
	constructor(params) {
		super();
		assert(
			params.accessKeyId && params.secretAccessKey,
			'"accessKeyId" and "secretAccessKey" not defined, those are required params for Cloudwatch datasource'
		);

		const config = {
			accessKeyId: params.accessKeyId,
			secretAccessKey: params.secretAccessKey,
			region: params.region || DEFAULT_REGION
		};

		if (params.proxy) config.httpOptions = { agent: proxy(params.proxy) };

		this._cloudwatch = new AWS.CloudWatch(config);
	}

	static get name() {
		return DATASOURCE_NAME;
	}

	static describe() {
		return {
			global: [
				{
					name: 'accessKeyId',
					isRequired: true,
					type: String,
					description: 'AWS access key ID'
				},
				{
					name: 'secretAccessKey',
					isRequired: true,
					type: String,
					description: 'AWS secret access key '
				},
				{
					name: 'region',
					isRequired: false,
					type: String,
					description: 'AWS region code (eg. ap-southeast-2 )'
				},
				{
					name: 'proxy',
					isRequired: false,
					type: String,
					description: 'Proxy'
				}
			],
			metric: [
				{
					name: 'Timeframe',
					isRequired: true,
					type: String,
					description:
						'Relative period to get data for (1 day, 3 weeks, 0.5 hours, etc), read [momentjs docs](http://momentjs.com/docs/#/manipulating/add/) to see possible values'
				},
				{
					name: 'TimeframeShift',
					isRequired: false,
					type: String,
					description:
						'Time period to shift data back in time (1 day ago, 3 weeks ago, etc)'
				},
				{
					name: 'MetricName',
					isRequired: true,
					type: String,
					description:
						'The name of the metric, with or without spaces'
				},
				{
					name: 'Namespace',
					isRequired: true,
					type: String,
					description:
						'The namespace of the metric, with or without spaces'
				},
				{
					name: 'Period',
					isRequired: false,
					type: Number,
					description:
						'The granularity, in seconds, of the returned datapoints'
				},
				{
					name: 'Statistics',
					isRequired: false,
					type: Array,
					description:
						'The metric statistics to return (1 max, [read more](http://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Statistic))'
				},
				{
					name: 'Dimensions',
					isRequired: true,
					type: Array,
					description:
						'A list of dimensions describing qualities of the metric ([read more](http://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CW_Support_For_AWS.html)'
				},
				{
					name: 'Unit',
					isRequired: true,
					type: String,
					description: 'The specific unit for a given metric '
				}
			]
		};
	}

	sendRequest(options) {
		return new Promise((resolve, reject) => {
			const params = Object.assign(
				{},
				DEFAULT_PARAMS,
				options,
				CloudwatchDatasource.getDatesFromTimeframe(
					options.Timeframe,
					options.TimeframeShift
				)
			);

			// AWS doesn't like custom params
			delete params.TimeframeShift;
			delete params.Timeframe;

			logger.debug(
				`Sending request to AWS Cloudwatch "${JSON.stringify(
					params
				).slice(0, 50)}..."`
			);

			this._cloudwatch.getMetricStatistics(params, (err, data) => {
				if (err) {
					logger.warn(`CloudwatchDatasource data error ${err}`);
					return reject(err);
				}

				const processedData = data.Datapoints
					.map(point => ({
						value: point[options.Statistics[0]],
						timestamp: point.Timestamp.valueOf()
					}))
					.sort((a, b) => (a.timestamp >= b.timestamp ? 1 : -1));

				if (!processedData.length)
					logger.debug(
						`Can't extract data from Cloudwatch datasourse. Request: ${JSON.stringify(
							params
						)}, response: ${JSON.stringify(data)}`
					);

				resolve(processedData);
			});
		});
	}
}

module.exports = CloudwatchDatasource;
