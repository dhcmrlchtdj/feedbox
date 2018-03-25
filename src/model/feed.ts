import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Column,
    BaseEntity,
    ManyToMany,
    JoinTable,
} from 'typeorm';

import { User } from './user';
import { TArticle, TArticleSimple } from '../lib/types';

@Entity()
export class Feed extends BaseEntity {
    @PrimaryGeneratedColumn() id: number;
    @CreateDateColumn() createAt: Date;
    @UpdateDateColumn() updateAt: Date;

    @Column() link: string;
    @Column() title: string;
    @Column('timestamp') date: Date;
    @Column('json') articles: TArticle<TArticleSimple>;

    @ManyToMany(type => User)
    @JoinTable()
    users: User[];
}
