import {
    BaseEntity,
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
} from 'typeorm'
import Feed from './feed'

@Entity()
export default class Link extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn({ select: false })
    createAt: Date

    @UpdateDateColumn({ select: false })
    updateAt: Date

    @Column({ length: 2048 })
    url: string

    @ManyToOne(
        _type => Feed,
        feed => feed.links,
    )
    feed: Feed
}
