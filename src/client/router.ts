import Router from 'vue-router';

const routes = [
    {
        path: '*',
        redirect: '/dashboard',
    },
    {
        path: '/dashboard',
        component: () => import('./page/dashboard.vue'),
        beforeEnter: (to, from, next) => {
            if (!false) {
                next('/login');
            } else {
                next();
            }
        },
    },
    {
        path: '/login',
        component: () => import('./page/login.vue'),
    },
];

const router = new Router({ routes });

export default router;
