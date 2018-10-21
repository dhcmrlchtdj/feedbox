import {
    BaseEntity,
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
} from "typeorm";
import User from "./user";

@Entity()
class Feed extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createAt: Date;

    @UpdateDateColumn()
    updateAt: Date;

    @Column({ unique: true })
    url: string;

    @ManyToMany(type => User, user => user.feeds)
    users: User[];
}

export default Feed;
