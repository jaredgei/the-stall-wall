const Path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const cssOutputPath = isProduction ? 'styles/app.[hash].css' : 'styles/app.css';
const jsOutputPath = isProduction ? 'scripts/app.[hash].js' : 'scripts/app.js';
const ExtractSASS = new ExtractTextPlugin(cssOutputPath);
const port = isProduction ? process.env.PORT || 8080 : process.env.PORT || 3000;

// ------------------------------------------
// Base
// ------------------------------------------
const webpackConfig = {
    resolve: {
        extensions: ['.js', '.jsx']
    },
    plugins: [
        new Webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(isProduction ? 'production' : 'development')
            }
        }),
        new HtmlWebpackPlugin({
            template: Path.join(__dirname, './src/app.html')
        })
    ],
    module: {
        loaders: [{
            test: /.jsx?$/,
            include: Path.join(__dirname, './src'),
            loader: 'babel-loader'
        }]
    }
};

// ------------------------------------------
// Entry points
// ------------------------------------------

if (isProduction) {
    webpackConfig.entry = [Path.join(__dirname, './src/template')];
} else {
    webpackConfig.entry = [
        'webpack/hot/dev-server',
        'webpack-hot-middleware/client?http://localhost:' + port,
        Path.join(__dirname, './src/template')
    ];
}

// ------------------------------------------
// Bundle output
// ------------------------------------------
webpackConfig.output = {
    path: Path.join(__dirname, './dist'),
    filename: jsOutputPath,
    hotUpdateChunkFilename: 'hot-updates/hot-update.js',
    hotUpdateMainFilename: 'hot-updates/hot-update.json'
};

// ------------------------------------------
// Devtool
// ------------------------------------------
webpackConfig.devtool = isProduction ? 'source-map' : 'cheap-eval-source-map';

// ------------------------------------------
// Module
// ------------------------------------------
if (isProduction) {
    webpackConfig.module.loaders.push({
        test: /\.scss$/,
        loader: ExtractSASS.extract(['css-loader', 'sass-loader'])
    });
} else {
    webpackConfig.module.loaders.push({
        test: /\.scss$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader']
    });
}

// ------------------------------------------
// Plugins
// ------------------------------------------
if (isProduction) {
    webpackConfig.plugins.push(
        new Webpack.optimize.UglifyJsPlugin({
            compressor: {
                warnings: false
            }
        }),
        ExtractSASS
    );
} else {
    webpackConfig.plugins.push(
        new Webpack.NamedModulesPlugin(),
        new Webpack.HotModuleReplacementPlugin()
    );
}

// ------------------------------------------
// Development server
// ------------------------------------------
if (!isProduction) {
    webpackConfig.devServer = {
        contentBase: Path.join(__dirname, './'),
        hot: true,
        port: port,
        inline: true,
        progress: true,
        historyApiFallback: true
    };
    webpackConfig.target = 'web';
}

module.exports = webpackConfig;
