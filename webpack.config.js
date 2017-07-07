require('dotenv').config();
var UglifyJsPlugin = require('uglifyjs-webpack-plugin');
var webpack = require('webpack');

module.exports = {
    entry: "./popup.js",
    devtool: 'cheap-source-map',
    output: {
        path: __dirname,
        filename: "bundle.js"
    },
    node: {
        fs: "empty"
    },
    plugins: [
        new webpack.DefinePlugin({
            API_KEY: JSON.stringify(process.env.API_KEY)
        }),
        new UglifyJsPlugin(),
        new webpack.NamedModulesPlugin()
    ],
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['env']
                }
            }
        }]
    }
};
