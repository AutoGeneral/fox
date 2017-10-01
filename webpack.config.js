const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ResourceHintWebpackPlugin = require('resource-hints-webpack-plugin');
const PreloadWebpackPlugin = require('preload-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ngAnnotatePlugin = require('ng-annotate-webpack-plugin');

const supportedBrowsers = [
	'Chrome >= 44',
	'Firefox >= 42',
	'IE >= 10',
	'Edge >= 12',
	'Safari >= 8',
	'ChromeAndroid >= 47',
	'Android >= 4.4',
	'ExplorerMobile >= 11',
	'iOS >= 6'
];

const uglifyJSConfig = {
	minimize: true,
	mangle: true,
	output: {
		comments: false
	},
	sourceMap: false,
	compress: {
		warnings: false,
		sequences: true,
		dead_code: true,
		conditionals: true,
		booleans: true,
		unused: true,
		if_return: true,
		join_vars: true,
		unsafe: true,
		loops: true,
		passes: 3
	}
};

const isProd = process.env.NODE_ENV !== 'development';

const extractSass = new ExtractTextPlugin({
	filename: '[name].[chunkhash].css',
	disable: !isProd
});

module.exports = {
	context: `${__dirname}/web`,

	entry: {
		app: ['./resources/styles/index.scss', './scripts/app.js']
	},

	output: {
		path: `${__dirname}/dist`,
		filename: '[name].[chunkhash].js',
		jsonpFunction: 'foxie',
		hashFunction: 'sha256'
	},

	module: {
		rules: [
			{
				test: /\.js$/,
				use: 'babel-loader'
			},
			{
				test: /\.json$/,
				loader: 'json-loader'
			},
			{
				test: /\.html$/,
				loader: 'html-loader',
				options: {
					minimize: true,
					minifyCSS: true,
					removeComments: true,
					collapseWhitespace: true,
					sortClassName: true,
					minifyJS: uglifyJSConfig
				}
			},
			{
				test: /\.scss$/,
				use: extractSass.extract({
					use: [
						{
							loader: 'css-loader',
							options: { importLoaders: true }
						},
						{
							loader: 'postcss-loader',
							options: {
								plugins: [].concat(
									isProd
										? [
												require('autoprefixer')({
													browsers: supportedBrowsers,
													cascade: false,
													supports: true,
													add: true,
													remove: true
												}),
												require('css-mqpacker')({
													sort: true
												}),
												require('cssnano')({
													discardComments: {
														removeAll: true
													},
													autoprefixer: {
														browsers: supportedBrowsers,
														cascade: false,
														supports: true,
														add: true,
														remove: true
													},
													safe: false
												})
											]
										: []
								)
							}
						},
						{
							loader: 'sass-loader',
							options: {
								includePaths: [
									...require('node-bourbon').includePaths,
									...require('node-neat').includePaths
								]
							}
						}
					],
					fallback: 'style-loader'
				})
			}
		]
	},

	plugins: [
		new ngAnnotatePlugin({ add: true }),
		new webpack.DefinePlugin({
			APP_NAME: "'Fox'"
		}),
		new HtmlWebpackPlugin({
			template: './resources/index.html',
			hash: false,
			cache: true
		}),
		extractSass,
		new ResourceHintWebpackPlugin(),
		new PreloadWebpackPlugin(),
		new webpack.optimize.CommonsChunkPlugin({
			name: 'vendor',
			minChunks(module) {
				return /node_modules|vendor/.test(module.userRequest);
			}
		}),
		new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en-au/),
		new webpack.LoaderOptionsPlugin({
			minimize: isProd,
			debug: !isProd
		})
	].concat(
		isProd
			? [
					new webpack.optimize.AggressiveMergingPlugin(),
					new webpack.optimize.ModuleConcatenationPlugin(),
					new webpack.optimize.UglifyJsPlugin(uglifyJSConfig)
				]
			: []
	)
};
