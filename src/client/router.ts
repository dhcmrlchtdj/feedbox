import Router from 'vue-router';

const routes = [
    {
        path: '*',
        redirect: '/dashboard',
    },
    {
        path: '/dashboard',
        component: () => import('./page/dashboard.vue'),
    },
    {
        path: '/login',
        component: () => import('./page/login.vue'),
    },
];

const router = new Router({ routes });

export default router;
