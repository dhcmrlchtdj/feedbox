import * as path from "path";
import Store from "openrecord/store/sqlite3";

import User from "./users";
import 


const store = new Store({
    file: path.resolve(__dirname, "../src/database/feedbox.sqlite"),
    autoLoad: true,
    autoConnect: true,
    autoAttributes: true,
});

export default store;
