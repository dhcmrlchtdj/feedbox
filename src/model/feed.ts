import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Column,
    BaseEntity,
} from 'typeorm';

import { Tarticle } from '../lib/types';

@Entity()
export class Feed extends BaseEntity {
    @PrimaryGeneratedColumn() id: number;
    @CreateDateColumn() createAt: Date;
    @UpdateDateColumn() updateAt: Date;

    @Column() link: string;
    @Column('timestamp') date: Date;
    @Column() title: string;
    @Column('json') articles: Tarticle[];
}
