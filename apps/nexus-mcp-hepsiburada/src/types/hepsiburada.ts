// ── Config ──────────────────────────────────────────────────────────────────

export interface HepsiburadaConfig {
	username: string
	password: string
	merchantId: string
	baseUrl?: string
}

// ── OAuth2 Token ─────────────────────────────────────────────────────────────

export interface OAuthToken {
	access_token: string
	token_type: string
	expires_in: number
	/** epoch ms when this token expires */
	expiresAt: number
}

// ── Listings ─────────────────────────────────────────────────────────────────

export interface HBListing {
	id: string
	merchantSku: string
	hepsiburadaSku: string
	productName: string
	categoryId: number
	categoryName: string
	price: number
	salePrice: number
	stock: number
	currency: string
	available: boolean
	images: string[]
}

export interface ListingListResponse {
	totalCount: number
	pageSize: number
	pageIndex: number
	data: HBListing[]
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export interface InventoryUpdateItem {
	merchantSku: string
	quantity: number
	price: number
}

export interface InventoryUpdateResponse {
	message: string
	trackingId?: string
}

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderStatus =
	| "Created"
	| "WaitingForPayment"
	| "Approved"
	| "ReadyToShip"
	| "Shipped"
	| "Delivered"
	| "Cancelled"
	| "Returned"

export interface OrderLine {
	lineItemId: string
	sku: string
	merchantSku: string
	productName: string
	quantity: number
	unitPrice: number
	totalPrice: number
}

export interface HBOrder {
	orderNumber: string
	packageNumber: string
	status: OrderStatus
	orderDate: string
	totalPrice: number
	currency: string
	customer: {
		firstName: string
		lastName: string
		city: string
		district: string
	}
	lines: OrderLine[]
}

export interface OrderListResponse {
	totalCount: number
	data: HBOrder[]
}

// ── Tracking ─────────────────────────────────────────────────────────────────

export interface TrackingUpdateResponse {
	success: boolean
	message: string
}

// ── Cancellations ─────────────────────────────────────────────────────────────

export interface Cancellation {
	id: string
	orderNumber: string
	packageNumber: string
	reason: string
	status: string
	requestDate: string
	claimType: "Cancel" | "Return"
	lines: {
		sku: string
		productName: string
		quantity: number
	}[]
}

export interface CancellationListResponse {
	totalCount: number
	data: Cancellation[]
}

// ── Settlements ───────────────────────────────────────────────────────────────

export interface Settlement {
	settlementDate: string
	orderNumber: string
	packageNumber: string
	sku: string
	productName: string
	saleAmount: number
	commission: number
	netAmount: number
	currency: string
}

export interface SettlementResponse {
	totalCount: number
	data: Settlement[]
}

// ── Error ─────────────────────────────────────────────────────────────────────

export class HepsiburadaApiError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly code: "unauthorized" | "rate_limit" | "server_error" | "unknown",
	) {
		super(message)
		this.name = "HepsiburadaApiError"
	}
}
