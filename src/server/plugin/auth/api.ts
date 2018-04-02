import * as User from '../../lib/db/user';

type Ttoken = {
    id: number;
    email: string;
};

export default async (decoded: Ttoken, req, h) => {
    const user = await User.getById(decoded.id);
    return { isValid: user !== undefined };
};
