import { PassThrough } from "stream";
import * as FeedParser from "feedparser";

type FeedItem = FeedParser.Item;
export { FeedItem };

const parse = async (feedurl: string, content: string): Promise<FeedItem[]> => {
    return new Promise<FeedItem[]>((resolve, reject) => {
        const feedparser = new FeedParser({ feedurl });
        const feed: FeedItem[] = [];

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
        pass.end(content);
    });
};

export default parse;
