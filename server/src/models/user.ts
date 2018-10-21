import {
    BaseEntity,
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    JoinTable,
} from "typeorm";
import Feed from "./feed";

@Entity()
class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createAt: Date;

    @UpdateDateColumn()
    updateAt: Date;

    @Column({ unique: true })
    email: string;

    @ManyToMany(type => Feed, feed => feed.users)
    @JoinTable()
    feeds: Feed[];
}

export default User;
