import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Column,
    BaseEntity,
    ManyToMany,
} from 'typeorm';

import { Feed } from './feed';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn() id: number;
    @CreateDateColumn() createAt: Date;
    @UpdateDateColumn() updateAt: Date;

    @Column() email: string;

    @ManyToMany(type => Feed)
    feeds: Feed[];
}
