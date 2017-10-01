const DATASOURCE_NAME = 'AbstractDatasource';

const assert = require('assert');
const moment = require('moment');

class AbstractDatasource {
	constructor() {}

	static get name() {
		return DATASOURCE_NAME;
	}

	static getDatesFromTimeframe(timeframe, timeframeShift) {
		function format(time) {
			const tmp = time
				.replace(/\s+ago/, '')
				.replace(/\s+/, ' ')
				.split(' ');
			const value = parseFloat(tmp[0]);
			if (isNaN(value)) {
				throw new Error(
					`Invalid timeframe ${tmp} for CloudwatchDatasource`
				);
			}
			return { value, text: tmp[1] };
		}

		const timeframeFormatted = format(timeframe);
		const timeObject = {
			StartTime: moment().subtract(
				timeframeFormatted.value,
				timeframeFormatted.text
			),
			EndTime: moment()
		};

		if (timeframeShift) {
			const timeframeShiftFormatted = format(timeframeShift);
			timeObject.StartTime = timeObject.StartTime.subtract(
				timeframeShiftFormatted.value,
				timeframeShiftFormatted.text
			);
			timeObject.EndTime = timeObject.EndTime.subtract(
				timeframeShiftFormatted.value,
				timeframeShiftFormatted.text
			);
		}

		return {
			StartTime: timeObject.StartTime.toDate(),
			EndTime: timeObject.EndTime.toDate()
		};
	}

	sendRequest(query) {
		return new Promise((resolve, reject) => {
			reject(`AbstractDatasource cannot be executed, query = ${query}`);
		});
	}

	/**
	 * @param {Array<String>} queries
	 * @return {Promise}
	 */
	getData(queries) {
		assert(
			Array.isArray(queries) && queries.length,
			'Scheduler passed empty queries array to the datasource. Check your metric config'
		);

		return new Promise((resolve, reject) => {
			const promises = queries.map(query => this.sendRequest(query));

			Promise.all(promises)
				.then(data => {
					resolve(data);
				})
				.catch(err => {
					reject(err);
				});
		});
	}
}

module.exports = AbstractDatasource;
