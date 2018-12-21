import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv-safe";
import replace from "rollup-plugin-replace";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import svelte from "rollup-plugin-svelte";
import { terser } from "rollup-plugin-terser";
import hash from "rollup-plugin-hash";
import serve from "rollup-plugin-serve";
import json from "rollup-plugin-json";

dotenv.config({
    path: path.resolve(__dirname, "./dotenv"),
    example: path.resolve(__dirname, "./dotenv.example"),
});

const prod = process.env.NODE_ENV === "production";
const envs = Object.entries(process.env).reduce((acc, curr) => {
    acc[`process.env.` + curr[0]] = JSON.stringify(curr[1]);
    return acc;
}, {});
const htmlTemplate = fs.readFileSync("./src/index.html").toString();

export default [
    {
        input: "./src/index.js",
        output: {
            file: "./_build/index.js",
            format: "esm",
            sourcemap: true,
        },
        plugins: [
            replace(envs),
            resolve(),
            commonjs(),
            svelte({ hydratable: true }),
            prod && terser({ output: { comments: "all" } }),
            hash({
                dest: "./_build/index.[hash:6].js",
                manifest: "./_build/manifest.json",
                callback: manifest => {
                    const html = htmlTemplate.replace(
                        "{/path/tp/index.js}",
                        manifest.replace("./_build", ""),
                    );
                    fs.writeFileSync("./_build/index.html", html);
                },
            }),
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
            resolve(),
            commonjs(),
            json(),
            svelte({ generate: "ssr" }),
            prod && terser(),
        ].filter(Boolean),
    },
];
