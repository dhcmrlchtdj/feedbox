const Store = require("openrecord/store/sqlite3");

class UserFeed extends Store.BaseModel {
    static definition() {
        this.validatesPresenceOf("url");
    }
}

export default UserFeed;
