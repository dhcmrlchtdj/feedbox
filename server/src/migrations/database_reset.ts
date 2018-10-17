export default function() {
    this.seed(async db => {
        const userModel = db.Model("users");
        const feedModel = db.Model("feeds");
        const userFeedModel = db.Model("user_feed");

        await userModel.deleteAll();
        await feedModel.deleteAll();
        await userFeedModel.deleteAll();

        console.log("reset step: delete all data");
    });
}
