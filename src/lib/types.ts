export type Tarticle = {
    guid: string;
    date: Date;
    link: string;
    title: string;
    description: string;
};

export type Tfeed = {
    link: string;
    date: Date;
    title: string;
    articles: Tarticle[];
};
