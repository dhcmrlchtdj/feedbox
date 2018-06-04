import 'make-promises-safe';
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import initModel from './model';

dotenv.config({
    path: path.resolve(__dirname, '../dotenv'),
});

export default async () => {
    await initModel();
};
