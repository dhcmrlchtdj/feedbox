import * as fs from "fs";
import * as path from "path";

const { mkdir, writeFile, readFile } = fs.promises;
const readStr = async p => (await readFile(p)).toString();
const readJSON = async p => JSON.parse(await readStr(p));

export default opt => {
    return {
        name: "template",
        generateBundle: async () => {
            await new Promise(r => setTimeout(r));

            const manifest = await readJSON(opt.manifest);
            const replace = s => {
                return Object.keys(manifest.entry).reduce((acc, key) => {
                    const val = manifest.entry[key];
                    const r = acc.replace(
                        new RegExp("\\$\\{" + key + "\\}", "g"),
                        val,
                    );
                    return r;
                }, s);
            };

            const files = Object.keys(opt.files).map(async input => {
                const file = await readStr(input);
                const content = replace(file);

                const output = opt.files[input];
                await mkdir(path.dirname(output), { recursive: true });
                await writeFile(output, content);
            });
            await files;
        },
    };
};
