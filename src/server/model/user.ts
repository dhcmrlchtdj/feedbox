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

import { Feed } from './feed';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn() id: number;
    @CreateDateColumn() createAt: Date;
    @UpdateDateColumn() updateAt: Date;

    @Column() email: string;

    @ManyToMany(type => Feed)
    @JoinTable()
    feeds: Feed[];
}
