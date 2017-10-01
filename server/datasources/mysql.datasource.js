const DATASOURCE_NAME = 'MySQL';

const AbstractDatasource = require('./abstract.datasource');
const logger = require('winston');
const assert = require('assert');
const mysql = require('mysql');
const moment = require('moment');

// Default timeslice in seconds
var timeslice = 5;

class MySQLDatasource extends AbstractDatasource {
	constructor(params) {
		super();

		this.connection = mysql.createConnection({
			host: params.host,
			user: params.user,
			password: params.password,
			database: params.database
		});
	}

	static get name() {
		return DATASOURCE_NAME;
	}

	static process(rows) {
		assert(
			Array.isArray(rows) && rows.length && rows[0].timestamp,
			'.process() function requires array of rows. Make sure to pass Arrays of JSON objects, each object must have "timestamp" property.'
		);

		const dataPoints = [];
		let currentTimeSliceMax = MySQLDatasource.getTimeSliceMax(
			MySQLDatasource.getDateInfo(rows[0].timestamp)
		);
		const lastTimeSliceMax = MySQLDatasource.getTimeSliceMax(
			MySQLDatasource.getDateInfo(rows[rows.length - 1].timestamp)
		);
		let previousDateInfo = '';
		let count = 0;

		// Fill dataPoints array with timeslices and correspondent zero values
		while (currentTimeSliceMax < lastTimeSliceMax) {
			dataPoints.push({ value: 0, timestamp: currentTimeSliceMax });
			currentTimeSliceMax = currentTimeSliceMax + timeslice * 60 * 1000;
		}

		rows.forEach((row, i) => {
			let dateInfo = MySQLDatasource.getDateInfo(row.timestamp);

			// Counting how many logins occurred in the same timeslice
			// If current login record is from the same lap (15 minutes time slice, 4 in each minute) as previous
			if (
				(dateInfo.lap === previousDateInfo.lap &&
					dateInfo.hours === previousDateInfo.hours &&
					dateInfo.day === previousDateInfo.day) ||
				i === 0
			) {
				count++;
			} else {
				dataPoints.forEach(dataPoint => {
					if (
						dataPoint.timestamp ===
						MySQLDatasource.getTimeSliceMax(previousDateInfo)
					)
						dataPoint.value = count;
				});
				count = 1;
			}
			previousDateInfo = dateInfo;
		});

		return dataPoints;
	}

	/**
	 * @static
	 * @description
	 * Returns JSON object with parameters used by other functions
	 *
	 * @param {String} date - Timestamp value from DB for login attempt
	 */
	static getDateInfo(date) {
		const d = new Date(date);

		return {
			data: date,
			lap: MySQLDatasource.getTimeLap(d),
			timestamp: Date.parse(date),
			year: d.getFullYear(),
			month: d.getMonth() + 1,
			day: d.getUTCDate(),
			hours: d.getUTCHours(),
			minutes: d.getMinutes(),
			seconds: d.getSeconds()
		};
	}

	/**
	 * @static
	 * @description
	 * Returns lap - 1-4 value that corresponds 15 min timeslice within the minute
	 *
	 * @param {Object} [d] - Date time object
	 */
	static getTimeLap(d) {
		let lap = Math.floor(d.getMinutes() / timeslice) + 1;
		if (
			d.getMinutes() % timeslice === 0 &&
			d.getSeconds() === 0 &&
			(d.getSeconds() === 0 && d.getMinutes() !== 0)
		)
			lap = lap - 1;
		return lap;
	}

	/**
	 * @static
	 * @description
	 * Returns max value for date timeslice - timestamp value
	 *
	 * @param {Object} [dateInfo] - JSON object with date time related parameters
	 */
	static getTimeSliceMax(dateInfo) {
		let d = new Date(dateInfo.data);

		const minutes =
			dateInfo.lap < 60 / timeslice ? dateInfo.lap * timeslice : 0;
		const hours = d.getHours();

		d.setSeconds(0);
		d.setMinutes(minutes);
		if (
			dateInfo.lap === 60 / timeslice &&
			dateInfo.minutes !== 0 &&
			dateInfo.seconds !== 0
		)
			d.setHours(hours + 1);

		return Date.parse(d);
	}

	sendRequest(params) {
		timeslice = params.timeslice;

		assert(params.query, 'query param required for MySQL.sendRequest');
		logger.debug(
			`Query database to retrieve login attempts:  "${params.query}"`
		);

		return new Promise((resolve, reject) => {
			this.connection.query(
				params.query,
				[moment().subtract(1, 'days').format('YYYY-MM-DD hh:mm:ss')],
				function(err, rows) {
					if (!err) {
						resolve(MySQLDatasource.process(rows));
					} else {
						reject(err);
					}
				}
			);
		});
	}
}

module.exports = MySQLDatasource;
