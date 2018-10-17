export default function() {
    this.removeTable("users");
    this.removeTable("feeds");
    this.removeTable("user_feed");

    console.log("reset step: drop tables");
}
