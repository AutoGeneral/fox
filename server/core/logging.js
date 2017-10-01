const RE_STACK_REPLACE1 = /(^[^\(]+?[\n$]|^\s+at\s+)/gm;
const winston = require('winston');

/**
 * @description
 * Configuration for logger with some custom pretty formatting
 *
 * @param {Object} config
 * @return {Object}
 */
module.exports = function Logger(config) {
	winston.remove(winston.transports.Console);

	const isJson = (config.logs || {}).json || true;

	winston.add(winston.transports.Console, {
		level: (config.logs || {}).level,
		colorize: !isJson,
		json: isJson,
		stringify: true,
		timestamp() {
			const date = new Date();
			return (
				('0' + date.getHours()).slice(-2) +
				':' +
				('0' + date.getMinutes()).slice(-2) +
				':' +
				('0' + date.getSeconds()).slice(-2) +
				'.' +
				('00' + date.getMilliseconds()).slice(-3) +
				' ' +
				('0' + date.getDate()).slice(-2) +
				'/' +
				('0' + (date.getMonth() + 1)).slice(-2)
			);
		},
		formatter(options) {
			return (
				winston.config.colorize(
					options.level,
					(options.level.toUpperCase() + '  ').slice(0, 5)
				) +
				': ' +
				this.timestamp() +
				' - ' +
				getLastStack() +
				' - ' +
				options.message +
				getMeta(options)
			);
		}
	});

	winston.add(winston.transports.File, {
		level: (config.logs || {}).level,
		json: false,
		filename: (config.logs || {}).file || `${__dirname}/../logs/server.log`
	});

	function getMeta(options) {
		if (Object.keys(options.meta).length) {
			if (options.meta.stack) return ' - ' + options.meta.stack;
			return ' - ' + JSON.stringify(options.meta);
		}
		return '';
	}

	function getLastStack() {
		const e = new Error('dummy');

		return (
			e.stack
				.replace(RE_STACK_REPLACE1, '')
				.split('\n')
				.splice(10, 1)[0] || 'Server'
		);
	}

	return winston;
};
