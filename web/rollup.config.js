import * as path from "path";
import * as dotenv from "dotenv-safe";
import replace from "rollup-plugin-replace";
import svelte from "rollup-plugin-svelte";
import { terser } from "rollup-plugin-terser";
import json from "rollup-plugin-json";
import serve from "rollup-plugin-serve";
import manifest from "./util/rollup-plugin-manifest";
import template from "./util/rollup-plugin-template";

const prod = process.env.NODE_ENV === "production";

dotenv.config({
    path: path.resolve(__dirname, "./dotenv"),
    example: path.resolve(__dirname, "./dotenv.example"),
});
const envs = Object.entries(process.env).reduce((acc, curr) => {
    acc[`process.env.` + curr[0]] = JSON.stringify(curr[1]);
    return acc;
}, {});

export default [
    {
        input: "./src/index.js",
        output: {
            dir: "./_build",
            entryFileNames: "[name].[hash].js",
            chunkFileNames: "[name].[hash].js",
            format: "esm",
            sourcemap: true,
        },
        plugins: [
            replace(envs),
            svelte({ hydratable: true }),
            manifest("./_build/manifest.json"),
            template({
                manifest: "./_build/manifest.json",
                files: { "./src/index.html": "./_build/index.html" },
            }),
            prod && terser(),
            process.env.DEV_SERVER &&
                serve({ port: 9000, contentBase: "./_build" }),
        ].filter(Boolean),
    },
    {
        input: "./src/sw.js",
        output: {
            file: "./_build/sw.js",
            format: "esm",
            sourcemap: true,
        },
        plugins: [
            replace(envs),
            json(),
            svelte({ generate: "ssr" }),
            prod && terser(),
        ].filter(Boolean),
    },
];
