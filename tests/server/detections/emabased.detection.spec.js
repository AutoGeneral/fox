'use strict';

const EmaBasedDetection = require('../../../server/detections/emabased.detection');
const assert = require('assert');

describe('EmaBasedDetection', () => {
	let emaBasedDetection;

	beforeEach(() => {
		emaBasedDetection = new EmaBasedDetection();
	});

	it('should have an object with .name field', () => {
		assert.ok(typeof EmaBasedDetection.name === 'string');
	});

	describe('getColumnAverageVectorFromMatrix', () => {
		function value(value) {
			return { value };
		}

		it('should return vector with columns averages', () => {
			const data = [
				[value(1), value(3), value(2), value(0), value(-4)],
				[value(2), value(5), value(1), value(0), value(4)],
				[value(3), value(4), value(0), value(0), value(0)]
			];
			assert.deepEqual(
				EmaBasedDetection.getColumnAverageVectorFromMatrix(data),
				[2, 4, 1, 0, 0]
			);
		});

		it('should return correct data even if the first vector is empty', () => {
			const data = [
				[],
				[],
				[value(1), value(3), value(2), value(0), value(-4)],
				[value(7), value(13), value(2), value(0), value(0)]
			];
			assert.deepEqual(
				EmaBasedDetection.getColumnAverageVectorFromMatrix(data),
				[4, 8, 2, 0, -2]
			);
		});

		it('should work correctly with data of different length', () => {
			const data = [
				[value(2), value(6)],
				[value(2), value(4), value(12), value(0), value(-1)]
			];
			assert.deepEqual(
				EmaBasedDetection.getColumnAverageVectorFromMatrix(data),
				[2, 5, 12, 0, -1]
			);
		});

		it('should use 0 if value is undefined or null', () => {
			const data = [
				[value(3), value(4)],
				[value(null), value(5)],
				[value(3)]
			];
			assert.deepEqual(
				EmaBasedDetection.getColumnAverageVectorFromMatrix(data),
				[3, 4.5]
			);
		});
	});

	describe('getColumnSecondBiggestElementVectorFromMatrix', () => {
		function value(value) {
			return { value };
		}

		it('should return vector with columns second biggest values', () => {
			const data = [
				[value(4), value(5), value(2), value(0), value(-3)],
				[value(2), value(5), value(1), value(0), value(4)],
				[value(3), value(4), value(11), value(0), value(-1)]
			];
			assert.deepEqual(
				EmaBasedDetection.getColumnSecondBiggestElementVectorFromMatrix(
					data
				),
				[3, 5, 2, 0, -1]
			);
		});

		it('should return correct data even if the first vector is empty', () => {
			const data = [
				[],
				[],
				[value(2), value(5), value(1), value(0), value(4)],
				[value(3), value(4), value(11), value(0), value(-1)]
			];
			assert.deepEqual(
				EmaBasedDetection.getColumnSecondBiggestElementVectorFromMatrix(
					data
				),
				[2, 4, 1, 0, -1]
			);
		});

		it('should return biggest if there is no seccond biggest', () => {
			const data = [[value(3), value(4), value(11), value(0), value(-1)]];
			assert.deepEqual(
				EmaBasedDetection.getColumnSecondBiggestElementVectorFromMatrix(
					data
				),
				[3, 4, 11, 0, -1]
			);
		});

		it('should work correctly with data of different length', () => {
			const data = [
				[value(2), value(6)],
				[value(3), value(4), value(11), value(0), value(-1)]
			];
			assert.deepEqual(
				EmaBasedDetection.getColumnSecondBiggestElementVectorFromMatrix(
					data
				),
				[2, 4, 11, 0, -1]
			);
		});

		it('should work correctly if one column is missing the value or has null', () => {
			const data = [
				[value(1), value(4)],
				[value(null)],
				[value(3), value(5)]
			];
			assert.deepEqual(
				EmaBasedDetection.getColumnSecondBiggestElementVectorFromMatrix(
					data
				),
				[1, 4]
			);
		});
	});

	describe('isPointAboveEnvelopeStrategy', () => {
		it('should mark amomaly point as event correctly', () => {
			const result = emaBasedDetection.isPointAboveEnvelopeStrategy([
				generateAnomalyArray(5, 1000)
			]);
			assert.ok(result[5].isEvent);
		});

		it('should ignore events with the data below envelope values', () => {
			const result = emaBasedDetection.isPointAboveEnvelopeStrategy([
				generateAnomalyArray(5, -1000)
			]);
			assert.ok(!result[5].isEvent);
		});
	});

	describe('isPointBelowEnvelopeStrategy', () => {
		it('should mark amomaly point as event correctly', () => {
			const result = emaBasedDetection.isPointBelowEnvelopeStrategy([
				generateAnomalyArray(5, -1000)
			]);
			assert.ok(result[5].isEvent);
		});

		it('should ignore events with the data ABOVE envelope values', () => {
			const result = emaBasedDetection.isPointBelowEnvelopeStrategy([
				generateAnomalyArray(5, 1000)
			]);
			assert.ok(!result[5].isEvent);
		});
	});

	describe('isPointOutsideEnvelopeStrategy', () => {
		it('should mark amomaly point as event correctly', () => {
			const result1 = emaBasedDetection.isPointOutsideEnvelopeStrategy([
				generateAnomalyArray(5, -1000)
			]);
			const result2 = emaBasedDetection.isPointOutsideEnvelopeStrategy([
				generateAnomalyArray(5, 1000)
			]);
			assert.ok(result1[5].isEvent);
			assert.ok(result2[5].isEvent);
		});
	});

	describe('isPointOutsidePreviousEnvelopeStrategy', () => {
		it('should mark amomaly point as event correctly', () => {
			// ---------------------------  upper envelope
			// 10 12 14 20 12 15 18 12 ...  previous data
			// ---------------------------  lower envelope
			//             5                spike
			// 0  1  0  2     0  1  2  ...  current data
			const result = emaBasedDetection.isPointOutsidePreviousEnvelopeStrategy(
				generateAnomalyArrayWithPrevious(5, 0, 2, 10, 20, 5, 10)
			);
			assert.ok(result[5].isEvent);
		});

		it('should ignore amomaly point in previous data envelope', () => {
			// ---------------------------     upper envelope
			// 10 12 14 20    12 15 18 12 ...  previous data
			// ------------11--------------    lower envelope, spike
			//            /  \
			// 0  1  0  2      0  1  2  ...    current data
			const result = emaBasedDetection.isPointOutsidePreviousEnvelopeStrategy(
				generateAnomalyArrayWithPrevious(5, 0, 1, 10, 12, 11, 10)
			);
			assert.ok(!result[5].isEvent);
		});
	});

	describe('isPointBelowPreviousEnvelopeStrategy', () => {
		it('should mark amomaly point as event correctly', () => {
			// ---------------------------  previous upper envelope
			// 10 12 14 20 12 15 18 12 ...  previous data
			// ---------------------------  previous lower envelope
			//             5                spike
			// 0  1  0  2     0  1  2  ...  current data
			const result = emaBasedDetection.isPointBelowPreviousEnvelopeStrategy(
				generateAnomalyArrayWithPrevious(5, 0, 2, 10, 20, 5, 10)
			);
			assert.ok(result[5].isEvent);
		});

		it('should ignore amomaly point in previous data envelope', () => {
			//               30                spike
			// --------------/\-------------   previous upper envelope
			// 10 12 11 11  /  \ 11 12 13 ...  previous data
			// ------------/ ---\-----------   previous lower envelope
			// 10 12 11 12       10 11 12 ...  current data
			const result = emaBasedDetection.isPointBelowPreviousEnvelopeStrategy(
				generateAnomalyArrayWithPrevious(5, 10, 12, 11, 13, 30, 10)
			);
			assert.ok(!result[5].isEvent);
		});
	});

	describe('isPointOutsideSmartEnvelopeStrategy', () => {
		it('should ignore amomalies inside of smart envelope', () => {
			// ------------------------------------  previous upper envelope
			// 15 16 17 15 16 16 16 15 16 17 16 ...  previous data
			// ------------15----------------------  previous lower envelope, spike
			// 10 12 11 12    10 11 12    11 12 ...  current data
			// ------------------------ 9----------  current data lower envelope, spike
			const data = generateAnomalyArrayWithPrevious(
				5,
				10,
				12,
				15,
				17,
				15,
				20
			);
			data[0][5].value = 15;
			data[0][10].value = 9;
			const result = emaBasedDetection.isPointOutsideSmartEnvelopeStrategy(
				data
			);
			assert.ok(!result[5].isEvent);
			assert.ok(!result[10].isEvent);
		});

		it('should mark points as events outside of smart envelope', () => {
			//               33                          spike
			// -------------/--\-------------------      previous upper envelope
			// 15 16 17 15 /    \ 16 16 15 16 17 16 ...  previous data
			// -----------/------\-----------------      previous lower envelope
			// 10 12 11 12        10 11 12    11 12 ...  current data
			// ---------------------------\  /-----      current data lower envelope
			//                             2             spike
			const data = generateAnomalyArrayWithPrevious(
				5,
				10,
				12,
				15,
				17,
				15,
				20
			);
			data[0][5].value = 33;
			data[0][10].value = 2;
			const result = emaBasedDetection.isPointOutsideSmartEnvelopeStrategy(
				data
			);
			assert.ok(result[5].isEvent);
			assert.ok(result[10].isEvent);
		});
	});
});

function random(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAnomalyArrayWithPrevious(
	index,
	min,
	max,
	prevMin,
	prevMax,
	delta,
	length
) {
	// pattern
	//      -             - delta
	// ...........        - previous values
	// ----- -----        - values
	const timestampStart = Date.now() - 1000000;
	return [
		new Array(length || 10).fill({}).map((item, i) => {
			return {
				value:
					index === i ? delta + random(min, max) : random(min, max),
				timeStamp: timestampStart + 1000 * i
			};
		}),
		new Array(length || 10).fill({}).map((item, i) => {
			return {
				value: random(prevMin, prevMax),
				timeStamp: timestampStart + 1000 * i - 100000
			};
		})
	];
}

function generateAnomalyArray(index, delta, length) {
	// pattern:
	//      -              - delta
	// ----- ------        - values
	const timestampStart = Date.now() - 1000000;
	return new Array(length || 10).fill({}).map((item, i) => {
		return {
			value: index === i ? delta + Math.random() : Math.random(),
			timeStamp: timestampStart + 1000 * i
		};
	});
}
