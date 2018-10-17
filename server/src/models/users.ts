const Store = require("openrecord/store/sqlite3");

class User extends Store.BaseModel {
    static definition() {
        this.validatesPresenceOf("email");
    }
}

export default User;
