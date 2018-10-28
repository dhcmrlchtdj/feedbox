const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ScriptExtHtmlWebpackPlugin = require("script-ext-html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

const prod = process.env.NODE_ENV === "production";
const filename = prod ? "[name].[contenthash]" : "[name]";
const stats = {
    assetsSort: "name",
    entrypoints: false,
    children: false,
    chunks: false,
    modules: false,
};

const config = {
    mode: prod ? "production" : "development",
    bail: prod,
    cache: !prod,
    devtool: prod ? "source-map" : "eval-source-map",
    target: "web",
    entry: "./src/index.js",
    output: {
        path: path.resolve(__dirname, "./dist"),
        filename: `${filename}.js`,
        chunkFilename: `${filename}.js`,
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: { sourceMap: true },
                    },
                ],
            },
            {
                test: /\.svelte$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "svelte-loader",
                        options: { emitCss: true },
                    },
                ],
            },
        ],
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                cache: true,
                parallel: true,
                sourceMap: true,
                extractComments: true,
            }),
            new OptimizeCSSAssetsPlugin({
                cssProcessorOptions: {
                    map: { inline: false },
                    discardComments: { removeAll: true },
                },
            }),
        ],
    },
    plugins: [
        prod && new CleanWebpackPlugin(path.resolve(__dirname, "./dist")),
        !prod && new webpack.NoEmitOnErrorsPlugin(),
        !prod && new webpack.HotModuleReplacementPlugin(),
        new webpack.HashedModuleIdsPlugin(),
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: "./src/template.html",
        }),
        new ScriptExtHtmlWebpackPlugin({
            defaultAttribute: "defer",
            custom: {
                test: /.*/,
                attribute: "crossorigin",
                value: "anonymous",
            },
        }),
        new MiniCssExtractPlugin({
            filename: `${filename}.css`,
            chunkFilename: `${filename}.css`,
        }),
        new webpack.ProgressPlugin(),
    ].filter(Boolean),
    resolve: {
        extensions: [".svelte", ".js", ".json", ".css"],
        mainFields: ["svelte", "browser", "module", "main"],
    },
    node: {
        process: false,
        global: false,
        Buffer: false,
        setImmediate: false,
    },
    performance: {
        hints: false,
    },
    stats,
    devServer: {
        disableHostCheck: true,
        host: "localhost",
        port: 9000,
        hot: true,
        inline: true,
        stats,
    },
};

module.exports = config;
