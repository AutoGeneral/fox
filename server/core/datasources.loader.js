const DATASOURCES_TO_IGNORE = ['abstract.datasource.js'];

const fs = require('fs');
const assert = require('assert');
const logger = require('winston');

class DatasourceLoader {
	constructor(config) {
		assert(
			config,
			'DatasourceLoader constructor requires configuration to be passed'
		);
		assert(config.dataSources, '"dataSources" must be defined in config');
		this._dataSourcesConfig = config.dataSources;
	}

	/**
	 * @param path
	 * @return {Map<String, Object>} Map with Datasource objects where key - class name
	 */
	load(path) {
		const datasources = new Map();
		fs
			.readdirSync(path)
			.filter(filename => !DATASOURCES_TO_IGNORE.includes(filename))
			.filter(filename => /.*\.datasource\.js/.test(filename))
			.forEach(filename => {
				const Datasource = require(`${path}/${filename}`);
				assert(
					Datasource.name,
					`"name" static property must be defined for datasource in ${filename}`
				);

				if (!this._dataSourcesConfig[Datasource.name]) {
					logger.info(
						`Configuration for "${Datasource.name}" datasource not found in config. Skipping...`
					);
					return;
				}

				const datasource = new Datasource(
					this._dataSourcesConfig[Datasource.name]
				);
				assert(
					datasource.getData,
					`"getData" function must be defined for datasource in ${filename}`
				);

				datasources.set(Datasource.name, datasource);
				logger.info(`Datasource "${Datasource.name}" has been loaded`);
			});

		return datasources;
	}
}

module.exports = DatasourceLoader;
