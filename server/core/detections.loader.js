const fs = require('fs');
const assert = require('assert');
const logger = require('winston');

class DetectionsLoader {
	constructor() {}

	/**
	 * @param path
	 * @return {Map<String, Object>} Map with Detections objects where key - class name
	 */
	load(path) {
		const detections = new Map();
		fs
			.readdirSync(path)
			.filter(filename => /.*\.detection\.js/.test(filename))
			.forEach(filename => {
				const Detection = require(`${path}/${filename}`);
				assert(
					Detection.name,
					`"name" static property must be defined for detection in ${filename}`
				);

				detections.set(Detection.name, Detection);
				logger.info(`Detection "${Detection.name}" has been loaded`);
			});

		return detections;
	}
}

module.exports = DetectionsLoader;
