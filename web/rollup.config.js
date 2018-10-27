import svelte from "rollup-plugin-svelte";
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { terser } from "rollup-plugin-terser";

const prod = process.env.NODE_ENV === "production";

export default {
    input: "src/app.js",
    output: {
        file: "dist/app.js",
        format: "iife",
        name: "app",
        sourcemap: true,
    },
    plugins: [
        svelte({
            dev: !prod,
            immutable: true,
            skipIntroByDefault: true,
            nestedTransitions: true,
        }),
        nodeResolve({
            module: true,
            main: true,
            browser: true,
        }),
        commonjs({
            include: "node_modules/**",
        }),
        prod && terser(),
    ],
};
