import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Column,
    BaseEntity,
    ManyToMany,
} from 'typeorm';

import { User } from './user';
import { TArticle, TArticleSimple } from '../lib/types';

@Entity()
export class Feed extends BaseEntity {
    @PrimaryGeneratedColumn() id: number;
    @CreateDateColumn() createAt: Date;
    @UpdateDateColumn() updateAt: Date;

    @Column() link: string;
    @Column() website: string;
    @Column() title: string;
    @Column('timestamp') date: Date;
    @Column('json') articles: TArticle<TArticleSimple>;

    @ManyToMany(_ => User)
    users: User[];
}
