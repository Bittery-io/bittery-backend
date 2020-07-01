import { Pool } from 'pg';

export const dbPool: Pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: Number.parseInt(process.env.DB_PORT!, 10),
});
