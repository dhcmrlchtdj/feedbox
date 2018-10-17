const Store = require("openrecord/store/sqlite3");

class Feed extends Store.BaseModel {
    static definition() {
        this.validatesPresenceOf("url");
    }
}

export default Feed
