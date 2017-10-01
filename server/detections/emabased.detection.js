const PREVIOUS_TYPE_AVERAGE = 'average';
const PREVIOUS_TYPE_EMA = 'ema';
const PREVIOUS_TYPE_SECOND_MAX = 'secondMax';
const DETECTION_NAME = 'EmaBasedDetection';

const gauss = require('gauss');
const assert = require('assert');
const logger = require('winston');
const TimeHelper = require('../helpers/time');
const Vector = gauss.Vector;

class EmaBasedDetection {
	constructor(options) {
		this._options = Object.assign(
			{
				emaInterval: 5,
				envelopKoeff: 0.33,
				percentile: 0.9,
				previousValues: PREVIOUS_TYPE_EMA,
				lowValueEnchancer: 10,
				ignoreHours: [],
				threshold: undefined
			},
			options
		);
	}

	static get name() {
		return DETECTION_NAME;
	}

	static getColumnAverageVectorFromMatrix(array) {
		// [ 0, 1, 4 ]
		// [ 2, 5, 1 ] => [ 2, 2.66, 2.33 ]
		// [ 3, 2, 2 ]
		const vector = [];
		const maxLength = Math.max.apply(null, array.map(arr => arr.length));

		for (let i = 0; i < maxLength; i++) {
			let avgValue = 0;
			let length = 0;
			for (let j = 0; j < array.length; j++) {
				if (array[j][i] && Number.isFinite(array[j][i].value)) {
					avgValue += array[j][i].value;
					length += 1;
				}
			}
			vector[i] = avgValue / length;
		}
		return vector;
	}

	static getColumnSecondBiggestElementVectorFromMatrix(array) {
		// [ 0, 1, 4 ]
		// [ 2, 5, 1 ] => [ 3, 5, 4 ]
		// [ 3, 2, 2 ]
		const result = [];
		const maxLength = Math.max.apply(null, array.map(arr => arr.length));

		for (let i = 0; i < maxLength; i++) {
			let biggest = -Infinity;
			let nextBiggest = -Infinity;
			for (let j = 0; j < array.length; j++) {
				const value = array[j][i] ? array[j][i].value : -Infinity;
				if (value >= biggest) {
					nextBiggest = biggest;
					biggest = value;
				} else if (value >= nextBiggest) {
					nextBiggest = value;
				}
			}
			result[i] = nextBiggest === -Infinity ? biggest : nextBiggest;
		}
		return result;
	}

	isPointAboveEnvelopeStrategy(dataPoints) {
		return this.detect(
			dataPoints[0],
			dataPoints.slice(1),
			dataPoint => dataPoint.value > dataPoint.upperEnvelope
		);
	}

	isPointBelowEnvelopeStrategy(dataPoints) {
		return this.detect(
			dataPoints[0],
			dataPoints.slice(1),
			dataPoint => dataPoint.value < dataPoint.lowerEnvelope
		);
	}

	isPointOutsideEnvelopeStrategy(dataPoints) {
		return this.detect(dataPoints[0], dataPoints.slice(1), dataPoint => {
			return (
				dataPoint.value > dataPoint.upperEnvelope ||
				dataPoint.value < dataPoint.lowerEnvelope
			);
		});
	}

	isPointOutsidePreviousEnvelopeStrategy(dataPoints) {
		let errorCount = 0;
		const results = this.detect(
			dataPoints[0],
			dataPoints.slice(1),
			dataPoint => {
				if (
					!dataPoint.lowerEnvelopePrevious &&
					!dataPoint.upperEnvelopePrevious
				)
					errorCount++;
				dataPoint.lowerEnvelope = dataPoint.lowerEnvelopePrevious;
				dataPoint.upperEnvelope = dataPoint.upperEnvelopePrevious;
				return (
					dataPoint.value > dataPoint.upperEnvelope ||
					dataPoint.value < dataPoint.lowerEnvelope
				);
			}
		);
		if (errorCount > dataPoints[0].length / 2) {
			logger.warn(
				'Function detected a high amount of missing data. Please make sure you configured it properly'
			);
		}
		return results;
	}

	isPointBelowPreviousEnvelopeStrategy(dataPoints) {
		let errorCount = 0;
		const results = this.detect(
			dataPoints[0],
			dataPoints.slice(1),
			dataPoint => {
				if (
					!dataPoint.lowerEnvelopePrevious &&
					!dataPoint.upperEnvelopePrevious
				)
					errorCount++;
				dataPoint.lowerEnvelope = dataPoint.lowerEnvelopePrevious;
				dataPoint.upperEnvelope = dataPoint.upperEnvelopePrevious;
				return dataPoint.value < dataPoint.lowerEnvelope;
			}
		);
		if (errorCount > dataPoints[0].length / 2) {
			logger.warn(
				'Function detected a high amount of missing data. Make sure you configured it properly'
			);
		}
		return results;
	}

	isPointOutsideSmartEnvelopeStrategy(dataPoints) {
		return this.detect(dataPoints[0], dataPoints.slice(1), dataPoint => {
			if (dataPoint.lowerEnvelopePrevious < dataPoint.lowerEnvelope) {
				dataPoint.lowerEnvelope = dataPoint.lowerEnvelopePrevious;
			}
			if (dataPoint.upperEnvelopePrevious > dataPoint.upperEnvelope) {
				dataPoint.upperEnvelope = dataPoint.upperEnvelopePrevious;
			}

			return (
				dataPoint.value > dataPoint.upperEnvelope ||
				dataPoint.value < dataPoint.lowerEnvelope
			);
		});
	}

	/**
	 * @param {Array<Object>} dataPoints
	 * @param {Array<Array<Object>>} previousValues
	 * @param {Function} detectionFunction
	 * @return {*|{}|Array}
	 */
	detect(dataPoints, previousValues, detectionFunction) {
		assert(
			Array.isArray(dataPoints),
			'.detect() function requires array of dataPoints. Make sure to pass Arrays of Arrays into a strategy function'
		);
		const ema = this.getExponentialMovingAverage(
			dataPoints.map(point => point.value)
		);
		const percentile = new Vector(dataPoints.map(i => i.value)).percentile(
			this._options.percentile
		);
		const previousValuesFormatted = this.formatPreviousValues(
			dataPoints.length,
			previousValues
		);

		return dataPoints.map((point, i) => {
			const emaLowerEnvelopeEnchanced = this.calc(
				ema[i],
				percentile,
				true
			);
			const emaUpperEnvelopeEnchanced = this.calc(
				ema[i],
				percentile,
				false
			);

			const processedPoint = Object.assign({}, point, {
				ema: ema[i],
				lowerEnvelope: emaLowerEnvelopeEnchanced,
				upperEnvelope: emaUpperEnvelopeEnchanced,
				previousValues: previousValuesFormatted[i]
			});

			if (previousValuesFormatted[i]) {
				processedPoint.upperEnvelopePrevious = this.calc(
					previousValuesFormatted[i],
					percentile,
					false
				);
				processedPoint.lowerEnvelopePrevious = this.calc(
					previousValuesFormatted[i],
					percentile,
					true
				);
			}

			processedPoint.isIgnored = TimeHelper.isTimeBetween(
				this._options.ignoreHours,
				processedPoint.timestamp
			);

			if (!processedPoint.isIgnored) {
				if (
					typeof this._options.threshold !== 'undefined' &&
					processedPoint.value < this._options.threshold
				) {
					processedPoint.isEvent = false;
				} else {
					processedPoint.isEvent = detectionFunction(processedPoint);
				}
			}
			return processedPoint;
		});
	}

	formatPreviousValues(dataPointsLength, previousValues) {
		const result = Array.from(Array(dataPointsLength - 1)).fill(undefined);
		if (!previousValues.length) return result;

		switch (this._options.previousValues) {
			case PREVIOUS_TYPE_SECOND_MAX:
				return EmaBasedDetection.getColumnSecondBiggestElementVectorFromMatrix(
					previousValues
				);
			case PREVIOUS_TYPE_AVERAGE:
				return EmaBasedDetection.getColumnAverageVectorFromMatrix(
					previousValues
				);
			case PREVIOUS_TYPE_EMA:
			default:
				return this.getExponentialMovingAverage(
					EmaBasedDetection.getColumnAverageVectorFromMatrix(
						previousValues
					)
				);
		}
	}

	getExponentialMovingAverage(arr) {
		const ema = new Vector(arr).ema(this._options.emaInterval);
		return Array.from(Array(this._options.emaInterval - 1))
			.fill(NaN)
			.concat(ema);
	}

	calc(ema, percentile, isLowerLimit) {
		const x = isLowerLimit ? -1 : 1;
		return (
			ema +
			ema * this._options.envelopKoeff * x +
			percentile / this._options.lowValueEnchancer * x
		);
	}
}

module.exports = EmaBasedDetection;
