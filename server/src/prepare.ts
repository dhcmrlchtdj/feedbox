import 'reflect-metadata';

import 'make-promises-safe';

import * as dotenv from 'dotenv';
dotenv.config();

import initModel from './model';

export default async () => {
    await initModel();
};
