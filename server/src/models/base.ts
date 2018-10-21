import { BaseEntity, CreateDateColumn, UpdateDateColumn } from "typeorm";

class Base extends BaseEntity {
    @CreateDateColumn()
    createAt: Date;

    @UpdateDateColumn()
    updateAt: Date;

    static async onlyOne(query) {
        query.take = 1;
        const arr = await this.find(query);
        if (arr.length) {
            return arr[0];
        } else {
            return null;
        }
    }
}

export default Base;
