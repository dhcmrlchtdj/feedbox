export default function() {
    this.createTable("users", { id: false }, function() {
        this.integer("id", { primary: true, not_null: true });
        this.datetime("created");
        this.datetime("updated");

        this.string("username", { unique: true, not_null: true });
    });

    this.createTable("feeds", { id: false }, function() {
        this.integer("id", { primary: true, not_null: true });
        this.datetime("created");
        this.datetime("updated");

        this.string("url", { unique: true, not_null: true });
    });

    this.createTable("user_feed", { id: false }, function() {
        this.integer("id", { primary: true, not_null: true });
        this.datetime("created");
        this.datetime("updated");

        this.integer("user_id", { not_null: true, references: "users.id" });
        this.integer("feed_id", { not_null: true, references: "feeds.id" });
    });

    this.createUniqueIndex("user_feed", ["user_id", "feed_id"]);

    console.log("migration step: setup basic tables and indexes");
}
