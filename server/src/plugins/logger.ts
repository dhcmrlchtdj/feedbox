import * as Good from "good";
import * as GoodConsole from "good-console";
import * as GoodSqueeze from "good-squeeze";

const logger = {
    plugin: Good,
    options: {
        ops: false,
        includes: {
            request: ["headers"],
            response: ["headers"],
        },
        reporters: {
            simple: [
                {
                    module: GoodSqueeze.Squeeze,
                    args: [
                        {
                            log: "*",
                            error: "*",
                            request: "*",
                            response: "*",
                        },
                    ],
                },
                {
                    module: GoodConsole,
                    args: [{ format: "YYYY-MM-DDTHH:mm:ss.SSS" }],
                },
                "stdout",
            ],
            detail: [
                {
                    module: GoodSqueeze.SafeJson,
                },
                "stdout",
            ],
        },
    },
};

export default logger;
