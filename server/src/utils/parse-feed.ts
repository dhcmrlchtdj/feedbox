import { PassThrough } from "stream";
import * as FeedParser from "feedparser";

const parse = async (feedurl: string, content: string) => {
    return new Promise((resolve, reject) => {
        const feedparser = new FeedParser({ feedurl });
        const feed: FeedParser.Item[] = [];

        feedparser.on("end", () => resolve(feed));
        feedparser.on("error", err => reject(err));
        feedparser.on("readable", function(this: any) {
            let item = this.read();
            while (item) {
                feed.push(item);
                item = this.read();
            }
        });

        const pass = new PassThrough();
        pass.pipe(feedparser);
        pass.write(content);
    });
};

export default parse;
