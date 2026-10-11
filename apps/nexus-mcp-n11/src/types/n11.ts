// ── Config ────────────────────────────────────────────────────────────────────

export interface N11Config {
	apiKey: string
	apiSecret: string
	baseUrl?: string
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface N11Auth {
	appKey: string
	appSecret: string
}

// ── Products ──────────────────────────────────────────────────────────────────

export type ProductStatus = "Active" | "Suspended" | "Rejected" | "Draft" | "WaitingForApproval"

export interface N11Product {
	id: string
	productSellerCode: string   // Satıcı stok kodu
	title: string
	subtitle: string
	description: string
	category: {
		id: number
		name: string
	}
	price: number
	currencyType: string
	images: { url: string; order: number }[]
	stockItems: N11StockItem[]
	productionDate?: string
	expirationDate?: string
	productCondition: number   // 1=Sıfır, 2=İkinci El
	preparingDay: number
	discount?: {
		startDate: string
		endDate: string
		type: string           // 1=Tutar, 2=Yüzde
		value: number
	}
	shipmentTemplate?: { id: number; name: string }
	groupAttribute?: string
	approvalStatus: ProductStatus
}

export interface N11StockItem {
	gtin?: string
	quantity: number
	version?: number
	attributes?: { name: string; value: string }[]
	sellerStockCode?: string
	optionPrice?: number
}

export interface ProductListResponse {
	pagingData: N11PagingData
	productList: {
		products: N11Product[]
	}
}

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderStatus =
	| "New"
	| "Approved"
	| "Rejected"
	| "Completed"
	| "Cancelled"
	| "PartialShipping"
	| "ReadyToShip"

export interface N11Order {
	id: string
	orderNumber: string
	status: OrderStatus
	createDate: string
	lastModifiedDate: string
	totalAmount: number
	estimatedDeliveryDate: string
	citizen: {
		fullName: string
		email: string
		phone: string
	}
	orderItems: N11OrderItem[]
	shipmentAddress: {
		fullName: string
		city: string
		district: string
		addressText: string
		phone: string
	}
	billingAddress: {
		fullName: string
		city: string
	}
}

export interface N11OrderItem {
	id: string
	productId: string
	productSellerCode: string
	productName: string
	quantity: number
	price: number
	totalPrice: number
	status: string
}

export interface OrderListResponse {
	pagingData: N11PagingData
	orderList: {
		order: N11Order[] | N11Order
	}
}

// ── Questions ─────────────────────────────────────────────────────────────────

export interface N11Question {
	id: string
	productId: string
	productTitle: string
	question: string
	questionDate: string
	status: "WaitingAnswer" | "Answered" | "Expired"
	answer?: string
	answerDate?: string
	askingUser?: string
}

export interface QuestionListResponse {
	pagingData: N11PagingData
	questionList: {
		question: N11Question[] | N11Question
	}
}

// ── Common ────────────────────────────────────────────────────────────────────

export interface N11PagingData {
	currentPage: number
	pageSize: number
	totalCount: number
	pageCount: number
}

// ── API Yanıt sarmalayıcı ─────────────────────────────────────────────────────

export interface N11Response<T> {
	result: {
		status: string
		errorCode?: string
		errorMessage?: string
	}
	data?: T
}

// ── Hata ─────────────────────────────────────────────────────────────────────

export class N11ApiError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly code: "unauthorized" | "rate_limit" | "not_found" | "server_error" | "unknown",
		public readonly n11ErrorCode?: string,
	) {
		super(message)
		this.name = "N11ApiError"
	}
}
