export default function() {
    this.removeColumn("users", "username");

    this.addColumn("users", function() {
        this.string("email", { unique: true, not_null: true });
    });

    this.createIndex("users", "email");

    console.log("migration step: add user email column");
}
