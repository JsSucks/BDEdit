const path = require('path');
const webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');

const vueLoader = {
	test: /\.(vue)$/,
	exclude: /node_modules/,
	loader: 'vue-loader'
};

const cssLoader = {
	test: /\.(css|scss)$/,
	loader: ['css-loader', 'sass-loader']
};

module.exports = {
	entry: './src/index.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'bdedit.js',
		library: {
			root: 'BDEdit',
			amd: 'bd-edit',
			commonjs: 'bd-edit'
		},
		libraryTarget: 'umd'
	},
	module: {
		rules: [vueLoader, cssLoader]
	},
	resolve: {
		alias: {
			vue$: path.resolve('node_modules', 'vue', 'dist', 'vue.esm.js')
		},
		modules: [
			path.resolve('node_modules')
		]
	},
	plugins: [
		new VueLoaderPlugin()
	],
	optimization: {
		minimize: true
	},
	mode: 'production'
};
