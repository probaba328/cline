// ── Config ──────────────────────────────────────────────────────────────────

export interface TrendyolConfig {
	supplierId: string
	apiKey: string
	apiSecret: string
	baseUrl?: string
}

// ── Products ─────────────────────────────────────────────────────────────────

export interface TrendyolProduct {
	barcode: string
	title: string
	productMainId: string
	brandId: number
	brandName: string
	categoryId: number
	categoryName: string
	quantity: number
	stockCode: string
	dimensionalWeight: number
	description: string
	currencyType: string
	listPrice: number
	salePrice: number
	vatRate: number
	cargoCompanyId: number
	images: { url: string }[]
	attributes: { attributeId: number; attributeName: string; attributeValue: string }[]
	approved: boolean
	archived: boolean
	onSale: boolean
	rejected: boolean
	blacklisted: boolean
}

export interface ProductListResponse {
	totalElements: number
	totalPages: number
	page: number
	size: number
	content: TrendyolProduct[]
}

// ── Stock & Price ─────────────────────────────────────────────────────────────

export interface StockItem {
	barcode: string
	quantity: number
}

export interface PriceItem {
	barcode: string
	salePrice: number
	listPrice: number
}

export interface BatchRequestResult {
	batchRequestId: string
}

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderStatus =
	| "Created"
	| "Picking"
	| "Invoiced"
	| "Shipped"
	| "Cancelled"
	| "Delivered"
	| "UnDelivered"
	| "Returned"
	| "Returend"

export interface OrderLine {
	quantity: number
	salesCampaignId: number
	productSize: string
	merchantSku: string
	productName: string
	productCode: number
	productColor: string
	barcode: string
	price: number
	amount: number
}

export interface Order {
	shipmentPackageId: number
	orderNumber: string
	status: OrderStatus
	orderDate: number
	totalPrice: number
	invoiceAddress: {
		firstName: string
		lastName: string
		company: string
		address1: string
		city: string
		district: string
	}
	lines: OrderLine[]
}

export interface OrderListResponse {
	totalElements: number
	totalPages: number
	page: number
	size: number
	content: Order[]
}

// ── Questions ─────────────────────────────────────────────────────────────────

export interface Question {
	id: number
	text: string
	createdDate: number
	productName: string
	productBarcode: string
	status: string
	customerFirstName: string
	customerLastName: string
}

export interface QuestionListResponse {
	totalElements: number
	totalPages: number
	content: Question[]
}

// ── Claims ────────────────────────────────────────────────────────────────────

export interface Claim {
	id: number
	orderNumber: string
	claimType: string
	status: string
	createdDate: number
	lines: {
		barcode: string
		productName: string
		quantity: number
	}[]
}

export interface ClaimListResponse {
	totalElements: number
	content: Claim[]
}

// ── Settlements ───────────────────────────────────────────────────────────────

export interface Settlement {
	transactionDate: number
	settlementId: string
	paymentOrderId: string
	totalPrice: number
	totalCommission: number
	totalDiscount: number
	totalTax: number
}

export interface SettlementResponse {
	totalElements: number
	content: Settlement[]
}

// ── API Error ─────────────────────────────────────────────────────────────────

export class TrendyolApiError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly code: "unauthorized" | "rate_limit" | "server_error" | "unknown",
	) {
		super(message)
		this.name = "TrendyolApiError"
	}
}
