import Database from "better-sqlite3"
import crypto from "crypto"
import fs from "fs"
import path from "path"
import type { LicenseRecord, LicenseStatus } from "../types/index.js"

// ── Setup ─────────────────────────────────────────────────────────────────────

const DB_PATH = process.env.DATABASE_URL ?? "./data/licenses.db"

function openDb(): Database.Database {
	const dir = path.dirname(DB_PATH)
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

	const db = new Database(DB_PATH)
	db.pragma("journal_mode = WAL")
	db.pragma("foreign_keys = ON")
	migrate(db)
	return db
}

function migrate(db: Database.Database): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS licenses (
			id                INTEGER PRIMARY KEY AUTOINCREMENT,
			license_key_hash  TEXT NOT NULL UNIQUE,
			ls_license_id     INTEGER,
			product_name      TEXT NOT NULL,
			variant_id        INTEGER,
			user_email        TEXT,
			status            TEXT NOT NULL DEFAULT 'active'
			                  CHECK (status IN ('active','expired','cancelled','paused')),
			expires_at        INTEGER,
			last_checked_at   INTEGER,
			created_at        INTEGER NOT NULL DEFAULT (unixepoch())
		);

		CREATE INDEX IF NOT EXISTS idx_licenses_status
			ON licenses(status);

		CREATE INDEX IF NOT EXISTS idx_licenses_product
			ON licenses(product_name);
	`)
}

let _db: Database.Database | null = null

export function getDb(): Database.Database {
	if (!_db) _db = openDb()
	return _db
}

// ── Hash helper — ham key asla saklanmaz ──────────────────────────────────────

export function hashKey(key: string): string {
	return crypto.createHash("sha256").update(key.trim().toUpperCase()).digest("hex")
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

interface Row {
	id: number
	license_key_hash: string
	ls_license_id: number | null
	product_name: string
	variant_id: number | null
	user_email: string | null
	status: LicenseStatus
	expires_at: number | null
	last_checked_at: number | null
	created_at: number
}

function rowToRecord(r: Row): LicenseRecord {
	return {
		id: r.id,
		licenseKeyHash: r.license_key_hash,
		lsLicenseId: r.ls_license_id,
		productName: r.product_name,
		variantId: r.variant_id,
		userEmail: r.user_email,
		status: r.status,
		expiresAt: r.expires_at,
		lastCheckedAt: r.last_checked_at,
		createdAt: r.created_at,
	}
}

export function findByKey(licenseKey: string): LicenseRecord | null {
	const hash = hashKey(licenseKey)
	const row = getDb()
		.prepare("SELECT * FROM licenses WHERE license_key_hash = ?")
		.get(hash) as Row | undefined
	return row ? rowToRecord(row) : null
}

export function findByLsId(lsLicenseId: number): LicenseRecord | null {
	const row = getDb()
		.prepare("SELECT * FROM licenses WHERE ls_license_id = ?")
		.get(lsLicenseId) as Row | undefined
	return row ? rowToRecord(row) : null
}

export function upsertLicense(params: {
	licenseKey: string
	lsLicenseId?: number
	productName: string
	variantId?: number
	userEmail?: string
	status: LicenseStatus
	expiresAt?: number | null
}): void {
	const hash = hashKey(params.licenseKey)
	const now = Math.floor(Date.now() / 1000)

	getDb().prepare(`
		INSERT INTO licenses
			(license_key_hash, ls_license_id, product_name, variant_id, user_email, status, expires_at, last_checked_at)
		VALUES
			(@hash, @lsId, @product, @variantId, @email, @status, @expiresAt, @now)
		ON CONFLICT (license_key_hash) DO UPDATE SET
			ls_license_id    = excluded.ls_license_id,
			product_name     = excluded.product_name,
			variant_id       = excluded.variant_id,
			user_email       = COALESCE(excluded.user_email, user_email),
			status           = excluded.status,
			expires_at       = excluded.expires_at,
			last_checked_at  = excluded.last_checked_at
	`).run({
		hash,
		lsId: params.lsLicenseId ?? null,
		product: params.productName,
		variantId: params.variantId ?? null,
		email: params.userEmail ?? null,
		status: params.status,
		expiresAt: params.expiresAt ?? null,
		now,
	})
}

export function updateStatus(lsLicenseId: number, status: LicenseStatus, expiresAt?: number | null): void {
	getDb().prepare(`
		UPDATE licenses
		SET status = ?, expires_at = COALESCE(?, expires_at), last_checked_at = unixepoch()
		WHERE ls_license_id = ?
	`).run(status, expiresAt ?? null, lsLicenseId)
}

export function touchCheckedAt(licenseKey: string): void {
	const hash = hashKey(licenseKey)
	getDb()
		.prepare("UPDATE licenses SET last_checked_at = unixepoch() WHERE license_key_hash = ?")
		.run(hash)
}
