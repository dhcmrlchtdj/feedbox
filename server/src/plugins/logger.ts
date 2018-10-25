import * as Good from "good";
import * as GoodConsole from "good-console";

const logger = {
    plugin: Good,
    options: {
        ops: false,
        reporters: {
            console: [
                {
                    module: GoodConsole,
                    args: [{ format: "YYYY-MM-DDTHH:mm:ss.SSS" }],
                },
                "stdout",
            ],
        },
    },
};

export default logger;
