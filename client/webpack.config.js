const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const devServerConfig = {
    contentBase: path.join(__dirname, 'dist'),
    compress: false,
    port: 9000
};

const config = {
    entry: './src/index.ts',
    mode: 'development',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: ['/node_modules/'],
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            onlyCompileBundledFiles: true
                        }
                    }
                ]
            }
        ]
    },
    devServer: devServerConfig,
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'src/index.html'),
            inject: 'body'
        })
    ],
    resolve: {
        alias: {
            '@client': path.resolve(__dirname)
        },
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    }
};

module.exports = config;
