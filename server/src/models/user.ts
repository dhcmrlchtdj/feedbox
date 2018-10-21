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

    @Column({ unique: true, nullable: true })
    githubId: number;

    @ManyToMany(_type => Feed, feed => feed.users)
    @JoinTable()
    feeds: Feed[];

    static async takeOne(query) {
        query.take = 1;
        const arr = await this.find(query);
        if (arr.length) {
            return arr[0];
        } else {
            return null;
        }
    }

    static async updateByKV(
        key: string,
        value: any,
        updateKey: string,
        updateValue: any,
    ) {
        const user = await User.takeOne({ where: { [key]: value } });
        if (user) {
            if (user[updateKey] !== updateValue) {
                user[updateKey] = updateValue;
                await user.save();
            }
        }
        return user;
    }

    static async takeOrCreateByGithub(githubId: number, email: string) {
        let user: User | null;

        user = await User.updateByKV("githubId", githubId, "email", email);
        if (user) return user;

        user = await User.updateByKV("email", email, "githubId", githubId);
        if (user) return user;

        user = new User();
        user.email = email;
        user.githubId = githubId;
        await user.save();

        return user;
    }
}

export default User;
