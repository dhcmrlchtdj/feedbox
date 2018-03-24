import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Column,
    BaseEntity,
} from 'typeorm';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn() id: number;
    @CreateDateColumn() createAt: Date;
    @UpdateDateColumn() updateAt: Date;

    @Column() email: string;
}
