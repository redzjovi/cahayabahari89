import { eq, sql } from 'drizzle-orm';
import { createDb, type DB } from './db';
import { users, roles, userRoles, rolePermissions, permissions, sessions } from './db/schema';

// Cloudflare Workers caps WebCrypto PBKDF2 at 100k iterations (local Node has
// no cap) — requesting more throws NotSupportedError and 500s auth in prod.
const PBKDF2_ITERATIONS = 100_000;
const LEGACY_PBKDF2_ITERATIONS = 600_000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type Bindings = {
	DB: D1Database;
	IMAGES: R2Bucket;
	IMAGES_URL?: string;
	ADMIN_EMAIL?: string;
	ADMIN_PASSWORD?: string;
	RESEND_API_KEY?: string;
};

const te = new TextEncoder();

function hex(bytes: ArrayBuffer | Uint8Array): string {
	return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function unhex(s: string): Uint8Array {
	const out = new Uint8Array(s.length / 2);
	for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
	return out;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey('raw', te.encode(password), 'PBKDF2', false, ['deriveBits']);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
		key,
		256
	);
	return new Uint8Array(bits);
}

/** "pbkdf2$<iterations>$<saltHex>$<hashHex>" — timing-safe compare on verify.
 * Legacy hashes ("saltHex$hashHex", 600k iterations) still verify so existing
 * local-dev users keep working; new hashes embed the count explicitly. */
export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
	return `pbkdf2$${PBKDF2_ITERATIONS}$${hex(salt)}$${hex(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	let iterations = LEGACY_PBKDF2_ITERATIONS;
	let saltHex: string;
	let hashHex: string;
	const parts = stored.split('$');
	if (parts.length === 4 && parts[0] === 'pbkdf2') {
		const parsed = Number(parts[1]);
		if (!Number.isInteger(parsed) || parsed <= 0) return false;
		iterations = parsed;
		saltHex = parts[2];
		hashHex = parts[3];
	} else if (parts.length === 2) {
		[saltHex, hashHex] = parts;
	} else {
		return false;
	}
	if (!saltHex || !hashHex) return false;
	let hash: Uint8Array;
	try {
		hash = await pbkdf2(password, unhex(saltHex), iterations);
	} catch {
		// e.g. legacy 600k-iteration hash verified on Workers (100k cap):
		// fail closed as a wrong password instead of 500ing the request.
		return false;
	}
	const expected = unhex(hashHex);
	if (hash.length !== expected.length) return false;
	let diff = 0;
	for (let i = 0; i < hash.length; i++) diff |= hash[i] ^ expected[i];
	return diff === 0;
}

async function sha256Hex(text: string): Promise<string> {
	return hex(await crypto.subtle.digest('SHA-256', te.encode(text)));
}

export function sessionExpiry(): string {
	return new Date(Date.now() + SESSION_TTL_MS).toISOString().replace('T', ' ').slice(0, 19);
}

function nowSqlite(): string {
	return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export type SessionUser = {
	id: number;
	email: string;
	name: string;
	status: string;
	roles: string[];
	permissions: Set<string>;
};

/** Create a session, returning the raw token (only shown once). */
export async function createSession(db: DB, userId: number): Promise<string> {
	const token = hex(crypto.getRandomValues(new Uint8Array(32)));
	await db.insert(sessions).values({ tokenHash: await sha256Hex(token), userId, expiresAt: sessionExpiry() });
	return token;
}

export async function getSessionUser(db: DB, token: string): Promise<SessionUser | null> {
	const row = await db
		.select({ userId: sessions.userId, expiresAt: sessions.expiresAt, tokenHash: sessions.tokenHash })
		.from(sessions)
		.where(eq(sessions.tokenHash, await sha256Hex(token)))
		.get();
	if (!row || row.expiresAt <= nowSqlite()) {
		if (row) await db.delete(sessions).where(eq(sessions.tokenHash, row.tokenHash));
		return null;
	}
	const user = await db
		.select({ id: users.id, email: users.email, name: users.name, status: users.status })
		.from(users)
		.where(eq(users.id, row.userId))
		.get();
	if (!user || user.status !== 'active') return null;

	const roleRows = await db
		.select({ slug: roles.slug })
		.from(userRoles)
		.innerJoin(roles, eq(userRoles.roleId, roles.id))
		.where(eq(userRoles.userId, user.id))
		.all();
	const permRows = roleRows.length
		? await db
				.select({ slug: permissions.slug })
				.from(rolePermissions)
				.innerJoin(roles, eq(rolePermissions.roleId, roles.id))
				.innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
				.where(sql`${roles.slug} IN (${sql.join(roleRows.map((r) => r.slug), sql`, `)})`)
				.all()
		: [];
	return {
		...user,
		roles: roleRows.map((r) => r.slug),
		permissions: new Set(permRows.map((p) => p.slug))
	};
}

export async function revokeSession(db: DB, token: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.tokenHash, await sha256Hex(token)));
}

/** Prune expired sessions opportunistically (cheap, runs on login). */
export async function pruneSessions(db: DB): Promise<void> {
	await db.delete(sessions).where(sql`${sessions.expiresAt} <= ${nowSqlite()}`);
}

/**
 * First-run bootstrap: if the users table is empty and ADMIN_EMAIL/ADMIN_PASSWORD
 * secrets are set, create that admin. Otherwise no-op. Safe to call on every auth request.
 */
export async function bootstrapAdmin(env: Bindings): Promise<void> {
	if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return;
	const db = createDb(env.DB);
	const count = await db.select({ count: sql<number>`count(*)` }).from(users).get();
	if ((count?.count ?? 0) > 0) return;
	const [user] = await db
		.insert(users)
		.values({ email: env.ADMIN_EMAIL, name: 'Administrator', passwordHash: await hashPassword(env.ADMIN_PASSWORD) })
		.returning({ id: users.id });
	const admin = await db.select({ id: roles.id }).from(roles).where(eq(roles.slug, 'admin')).get();
	if (user && admin) await db.insert(userRoles).values({ userId: user.id, roleId: admin.id });
}

/** Validate credentials; returns user row (sans hash) or null. */
export async function authenticate(db: DB, email: string, password: string) {
	const user = await db
		.select({ id: users.id, email: users.email, name: users.name, status: users.status, passwordHash: users.passwordHash })
		.from(users)
		.where(eq(users.email, email))
		.get();
	if (!user || user.status !== 'active') return null;
	if (!(await verifyPassword(password, user.passwordHash))) return null;
	const { passwordHash: _drop, ...safe } = user;
	return safe;
}

/** Bearer token -> SessionUser (with lazy bootstrap). Null on any failure. */
export async function requireSessionUser(env: Bindings, authHeader: string | null | undefined): Promise<SessionUser | null> {
	const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
	if (!token) return null;
	await bootstrapAdmin(env);
	return getSessionUser(createDb(env.DB), token);
}

/** Cleanup helper for tests/dev: wipe all sessions of a user. */
export async function revokeUserSessions(db: DB, userId: number): Promise<void> {
	await db.delete(sessions).where(eq(sessions.userId, userId));
}
