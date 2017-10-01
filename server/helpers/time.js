const moment = require('moment');

class TimeHelper {
	constructor() {}

	/**
	 * @description
	 * Returns boolean value answering on question
	 * does 'time' value belongs to one of 'timeRanges' periods
	 *
	 * Examples:
	 *   isTimeBetween(['22:30', '00:30'], moment('2015-02-10 23:45', 'YYYY-MM-DD HH:MM') returns true
	 *   isTimeBetween([['22:30', '00:30'], ['10:30', '11:00']], moment('2015-02-10 10:45', 'YYYY-MM-DD HH:MM') returns true
	 *   isTimeBetween(['12:00', '23:00'], moment('2015-11-11 11:11', 'YYYY-MM-DD HH:MM') returns false
	 *
	 * @param {Array<String>|Array<Array<String>>} timeRanges
	 * @param {Number|Moment} time
	 * @return {Boolean}
	 */
	static isTimeBetween(timeRanges, time) {
		if (!timeRanges || !timeRanges.length) return false;

		const pointDate = moment(time).utcOffset('+10:00');
		const ignored = [];
		const timeRangesProcessed = Array.isArray(timeRanges[0])
			? timeRanges
			: [timeRanges];

		timeRangesProcessed.forEach(timeRange => {
			const startDate = timeRange[0].split(':').map(i => parseInt(i, 10));
			const endDate = timeRange[1].split(':').map(i => parseInt(i, 10));

			if (timeRange[0] > timeRange[1]) {
				ignored.push([
					pointDate.clone().hours(startDate[0]).minutes(startDate[1]),
					pointDate.clone().endOf('day')
				]);
				ignored.push([
					pointDate.clone().startOf('day').set('millisecond', 0),
					pointDate.clone().hours(endDate[0]).minutes(endDate[1])
				]);
			} else {
				ignored.push([
					pointDate.clone().hours(startDate[0]).minutes(startDate[1]),
					pointDate.clone().hours(endDate[0]).minutes(endDate[1])
				]);
			}
		});
		return ignored.reduce(
			(a, b) => a || pointDate.isBetween(b[0], b[1]),
			false
		);
	}
}

module.exports = TimeHelper;
