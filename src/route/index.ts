import page from './page';
import login from './login';
import timerApi from './api-timer';
import userApi from './api-user';

const route = [...page, ...login, ...timerApi, ...userApi];

export default route;
