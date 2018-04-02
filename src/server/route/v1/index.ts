import login from './login';
import wakeup from './wakeup';
import user from './user';

const route = [...login, ...wakeup, ...user];

export default route;
