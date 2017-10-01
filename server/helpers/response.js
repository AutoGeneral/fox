const HTTP_CODE = {
	OK: 200,
	BAD_REQUEST: 400
};

class ResponseHelper {
	/**
	 * @description
	 * Sends success response to the user
	 *
	 * @param {Object} res response object
	 * @param {Object} [data] content to return
	 */
	static success(res, data) {
		const result = data || {};
		result.status = 'ok';
		res.send(HTTP_CODE.OK, result);
	}

	/**
	 * @description
	 * Sends error response to the user
	 *
	 * @param {Object} res response object
	 * @param {Object} [data] content to return
	 * @param {Number} [code=400] error code
	 */
	static fail(res, data, code) {
		const result = data || {};
		result.status = 'error';
		result.code = code || HTTP_CODE.BAD_REQUEST;
		res.send(data.code, result);
	}

	/**
	 * @description
	 * Recoursively masks fields in object
	 *
	 * @param {Object} object
	 * @param {Array<String>} fields List of field names to mask
	 * @returns {Object}
	 */
	static maskFields(object, fields) {
		Object.keys(object).forEach(propertyName => {
			if (fields.indexOf(propertyName) !== -1)
				object[propertyName] = '******';
			else if (
				typeof object[propertyName] === 'object' &&
				!Array.isArray(object)
			) {
				object[propertyName] = ResponseHelper.maskFields(
					object[propertyName],
					fields
				);
			}
		});
		return object;
	}
}

module.exports = ResponseHelper;
