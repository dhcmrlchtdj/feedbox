import {
    BaseEntity,
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToMany,
} from 'typeorm'
import User from './user'
import Link from './link'

@Entity()
export default class Feed extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn({ select: false })
    createAt: Date

    @UpdateDateColumn({ select: false })
    updateAt: Date

    @Column({ unique: true, length: 2048 })
    url: string

    @Column({ nullable: true })
    lastUpdated: Date

    @Column({ nullable: true })
    lastCheck: Date

    @Column({ type: 'text', nullable: true, select: false })
    content: string

    @OneToMany(_type => Link, link => link.feed)
    links: Link[]

    @ManyToMany(_type => User, user => user.feeds)
    users: User[]

    static async takeOne(query): Promise<Feed | undefined> {
        query.take = 1
        const arr = await this.find(query)
        if (arr.length) {
            return arr[0]
        } else {
            return
        }
    }

    static async takeAll(): Promise<Feed[]> {
        const feeds = await Feed.createQueryBuilder('feed')
            .innerJoinAndSelect('feed.users', 'user')
            .leftJoinAndSelect('feed.links', 'link')
            .getMany()
        return feeds
    }

    static async takeOrCreate(url: string): Promise<Feed> {
        let feed = await Feed.takeOne({ where: { url } })
        if (!feed) {
            feed = new Feed()
            feed.url = url
            await feed.save()
        }
        return feed
    }

    static async takeByUser(userId: number): Promise<Feed[]> {
        const feeds = await Feed.createQueryBuilder('feed')
            .innerJoin('feed.users', 'user', 'user.id = :userId', { userId })
            .orderBy('feed.lastUpdated', 'DESC')
            .getMany()
        return feeds
    }

    static async addUser(feedId: number, userId: number): Promise<void> {
        try {
            await Feed.createQueryBuilder('feed')
                .relation(Feed, 'users')
                .of(feedId)
                .add(userId)
        } catch (err) {
            const msg = err.message
            if (msg && /unique/i.test(msg)) return
            throw err
        }
    }

    static async removeUser(feedId: number, userId: number): Promise<void> {
        await Feed.createQueryBuilder('feed')
            .relation(Feed, 'users')
            .of(feedId)
            .remove(userId)
    }
}
