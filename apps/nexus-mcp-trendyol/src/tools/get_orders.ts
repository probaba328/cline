import type { TrendyolClient } from "../api/client.js"
import type { OrderListResponse } from "../types/trendyol.js"

export const GET_ORDERS_TOOL = {
	name: "get_orders",
	description: "Siparişleri listele. Tarih aralığı ve durum filtresi ile.",
	inputSchema: {
		type: "object" as const,
		properties: {
			startDate: {
				type: "string",
				description: "Başlangıç tarihi (ISO 8601: 2024-01-01 veya 2024-01-01T00:00:00)",
			},
			endDate: {
				type: "string",
				description: "Bitiş tarihi (ISO 8601: 2024-01-31 veya 2024-01-31T23:59:59)",
			},
			status: {
				type: "string",
				enum: ["Created", "Picking", "Invoiced", "Shipped", "Cancelled", "Delivered", "Returned", "all"],
				description: "Sipariş durumu filtresi",
				default: "all",
			},
			page: {
				type: "number",
				description: "Sayfa numarası (0'dan başlar)",
				default: 0,
			},
			size: {
				type: "number",
				description: "Sayfa başına sipariş sayısı (maks 200)",
				default: 50,
			},
		},
		required: [],
	},
}

export async function getOrders(
	client: TrendyolClient,
	args: {
		startDate?: string
		endDate?: string
		status?: string
		page?: number
		size?: number
	},
): Promise<string> {
	const page = args.page ?? 0
	const size = Math.min(args.size ?? 50, 200)

	const params = new URLSearchParams({
		page: String(page),
		size: String(size),
	})

	if (args.startDate) {
		params.set("startDate", String(toEpochMs(args.startDate)))
	}
	if (args.endDate) {
		params.set("endDate", String(toEpochMs(args.endDate)))
	}
	if (args.status && args.status !== "all") {
		params.set("status", args.status)
	}

	const data = await client.get<OrderListResponse>(`/orders?${params}`)

	const summary = data.content.map((o) => ({
		shipmentPackageId: o.shipmentPackageId,
		orderNumber: o.orderNumber,
		status: o.status,
		orderDate: new Date(o.orderDate).toISOString(),
		totalPrice: o.totalPrice,
		itemCount: o.lines.reduce((s, l) => s + l.quantity, 0),
		customer: `${o.invoiceAddress.firstName} ${o.invoiceAddress.lastName}`.trim(),
		city: o.invoiceAddress.city,
	}))

	return JSON.stringify(
		{
			totalElements: data.totalElements,
			totalPages: data.totalPages,
			page: data.page,
			size: data.size,
			orders: summary,
		},
		null,
		2,
	)
}

function toEpochMs(dateStr: string): number {
	const d = new Date(dateStr)
	if (isNaN(d.getTime())) {
		throw new Error(`Geçersiz tarih formatı: ${dateStr}. ISO 8601 kullan (örn: 2024-01-01)`)
	}
	return d.getTime()
}
