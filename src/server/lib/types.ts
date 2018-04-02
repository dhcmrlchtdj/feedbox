export type TArticleSimple = {
    guid: string;
    date: Date;
    link: string;
    title: string;
};
export type TArticleFull = {
    guid: string;
    date: Date;
    link: string;
    title: string;
    description: string;
};

export type TArticle<T> = {
    [guid: string]: T;
};

export interface TFeed {
    link: string;
    title: string;
    date: Date;
    articles: TArticle<TArticleFull>;
}
