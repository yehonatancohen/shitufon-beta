const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = [
    {
        plugins: [
            new webpack.DefinePlugin({
                'process.env.FLUENTFFMPEG_COV': false,
            }),
        ],
        mode: 'development',
        target: 'electron-main',
        entry: './src/main.ts',
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    include: /src/,
                    use: [{ loader: 'ts-loader' }]
                }
            ]
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'main.js'
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        externals: [nodeExternals()]
    },
    {
        mode: 'development',
        target: 'electron-preload',
        entry: './src/preload.ts',
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    include: /src/,
                    use: [{ loader: 'ts-loader' }]
                }
            ]
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'preload.js'
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        externals: [nodeExternals()]
    },
    {
        mode: 'development',
        target: 'electron-renderer',
        entry: './src/renderer.ts',
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    include: /src/,
                    use: [{ loader: 'ts-loader' }]
                }
            ]
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'renderer.js'
        },
        resolve: {
            extensions: ['.ts', '.js']
        }
    }
];