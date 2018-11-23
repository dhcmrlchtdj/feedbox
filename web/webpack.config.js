const path = require("path");
const webpack = require("webpack");
const DotenvPlugin = require("webpack-dotenv-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ScriptExtHtmlWebpackPlugin = require("script-ext-html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const ServiceWorkerWebpackPlugin = require("serviceworker-webpack-plugin");

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
                        options: {
                            emitCss: true,
                            shared: false,
                            skipIntroByDefault: true,
                            nestedTransitions: true,
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: [".svelte", ".js", ".json", ".css"],
        mainFields: ["svelte", "browser", "module", "main"],
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
        moduleIds: "hashed",
    },
    plugins: [
        !prod && new webpack.ProgressPlugin(),
        !prod && new webpack.HotModuleReplacementPlugin(),
        prod && new CleanWebpackPlugin(path.resolve(__dirname, "./dist")),
        new DotenvPlugin({
            sample: path.resolve(__dirname, "./dotenv.example"),
            path: path.resolve(__dirname, "./dotenv"),
        }),
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
        new ServiceWorkerWebpackPlugin({
            entry: path.resolve(__dirname, "./src/sw.js"),
        }),
    ].filter(Boolean),
    devServer: {
        disableHostCheck: true,
        host: "0.0.0.0",
        port: Number(process.env.PORT || 9000),
        hot: true,
        inline: true,
        stats,
    },
    devtool: prod ? "source-map" : "eval-source-map",
    target: "web",
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
    bail: prod,
};

module.exports = config;
