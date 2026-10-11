import type { HepsiburadaClient } from "../api/client.js"
import type { OrderListResponse } from "../types/hepsiburada.js"

export const GET_ORDERS_TOOL = {
	name: "get_orders",
	description: "Hepsiburada siparişlerini listeler. Durum, tarih ve müşteri bilgilerini içerir.",
	inputSchema: {
		type: "object" as const,
		properties: {
			status: {
				type: "string",
				description:
					"Sipariş durumu filtresi (Created | WaitingForPayment | Approved | ReadyToShip | Shipped | Delivered | Cancelled | Returned)",
			},
			startDate: {
				type: "string",
				description: "Başlangıç tarihi ISO 8601 formatında (ör. 2024-01-01T00:00:00Z)",
			},
			endDate: {
				type: "string",
				description: "Bitiş tarihi ISO 8601 formatında",
			},
			offset: {
				type: "number",
				description: "Sayfalama başlangıç noktası (varsayılan: 0)",
			},
			limit: {
				type: "number",
				description: "Sayfa başına sonuç sayısı (varsayılan: 20, max: 100)",
			},
		},
		required: [],
	},
}

export async function handleGetOrders(
	client: HepsiburadaClient,
	args: {
		status?: string
		startDate?: string
		endDate?: string
		offset?: number
		limit?: number
	},
): Promise<string> {
	const offset = args.offset ?? 0
	const limit = Math.min(args.limit ?? 20, 100)

	const params = new URLSearchParams({
		merchantId: client.mid,
		offset: String(offset),
		limit: String(limit),
	})
	if (args.status) params.append("status", args.status)
	if (args.startDate) params.append("startDate", args.startDate)
	if (args.endDate) params.append("endDate", args.endDate)

	const data = await client.get<OrderListResponse>(`/order/api/orders?${params.toString()}`)

	const lines = [
		`Toplam: ${data.totalCount} sipariş | offset=${offset}, limit=${limit}`,
		"",
	]

	for (const order of data.data) {
		lines.push(
			`Sipariş #${order.orderNumber} | Paket: ${order.packageNumber}`,
			`  Durum: ${order.status} | Tarih: ${order.orderDate}`,
			`  Müşteri: ${order.customer.firstName} ${order.customer.lastName} — ${order.customer.city}/${order.customer.district}`,
			`  Toplam: ${order.totalPrice} ${order.currency}`,
			`  Ürünler:`,
		)
		for (const line of order.lines) {
			lines.push(
				`    • ${line.productName} (SKU: ${line.merchantSku}) x${line.quantity} — ${line.totalPrice} ${order.currency}`,
			)
		}
		lines.push("")
	}

	return lines.join("\n").trimEnd()
}
