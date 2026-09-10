import { Hono } from 'hono';
import type { Env } from './http/middleware';
import api from './routes/api';

/** Thin bootstrap (Laravel bootstrap/app.php equivalent):
 * all routes live in routes/api.ts, handlers in controllers/*. */
const app = new Hono<Env>();

app.route('/api', api);

export default app;
export type AppType = typeof app;
