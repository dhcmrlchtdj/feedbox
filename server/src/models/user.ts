import {
    BaseEntity,
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    JoinTable,
} from 'typeorm'
import Feed from './feed'

@Entity()
export default class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn({ select: false })
    createAt: Date

    @UpdateDateColumn({ select: false })
    updateAt: Date

    @Column({ unique: true, length: 256 })
    email: string

    @Column({ unique: true, nullable: true })
    githubId: number

    @ManyToMany(
        _type => Feed,
        feed => feed.users,
    )
    @JoinTable()
    feeds: Feed[]

    static async takeOne(query): Promise<User | undefined> {
        query.take = 1
        const arr = await this.find(query)
        if (arr.length) {
            return arr[0]
        } else {
            return
        }
    }

    static async takeById(userId: number): Promise<User | undefined> {
        const user = await User.takeOne({
            where: { id: userId },
        })
        return user
    }

    static async updateByKV(
        key: string,
        value: any,
        updateKey: string,
        updateValue: any,
    ): Promise<User | undefined> {
        const user = await User.takeOne({ where: { [key]: value } })
        if (user && updateValue) {
            if (user[updateKey] !== updateValue) {
                user[updateKey] = updateValue
                await user.save()
            }
        }
        return user
    }

    static async takeOrCreateByGithub(
        githubId: number,
        email: string,
    ): Promise<User> {
        let user: User | undefined

        user = await User.updateByKV('githubId', githubId, 'email', email)
        if (user) return user

        user = await User.updateByKV('email', email, 'githubId', githubId)
        if (user) return user

        user = new User()
        user.email = email
        user.githubId = githubId
        await user.save()

        return user
    }
}
