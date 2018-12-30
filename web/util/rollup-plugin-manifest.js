import * as fs from "fs";
import * as path from "path";

const { mkdir, writeFile } = fs.promises;

export default opt => {
    return {
        name: "manifest",
        generateBundle: async (options, bundle, isWrite) => {
            const manifest = Object.keys(bundle).reduce((acc, key) => {
                const entry = bundle[key];
                if (entry.isEntry) acc[entry.name] = entry.fileName;
                return acc;
            }, {});
            const json = JSON.stringify(manifest, null, 4);
            await mkdir(path.dirname(opt), { recursive: true });
            await writeFile(opt, json);
        },
    };
};
