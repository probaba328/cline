import type { N11Client } from "../api/client.js"
import type { OrderListResponse, N11Order, OrderStatus } from "../types/n11.js"

export const GET_ORDERS_TOOL = {
	name: "get_orders",
	description: "N11 siparişlerini listeler. Tarih aralığı ve durum filtresi destekler.",
	inputSchema: {
		type: "object" as const,
		properties: {
			startDate: {
				type: "string",
				description: "Başlangıç tarihi (dd/MM/yyyy formatında, ör. 01/01/2024)",
			},
			endDate: {
				type: "string",
				description: "Bitiş tarihi (dd/MM/yyyy formatında)",
			},
			status: {
				type: "string",
				description: "Sipariş durumu: New | Approved | Rejected | Completed | Cancelled | ReadyToShip",
				enum: ["New", "Approved", "Rejected", "Completed", "Cancelled", "PartialShipping", "ReadyToShip"],
			},
			page: {
				type: "number",
				description: "Sayfa numarası, 0'dan başlar (varsayılan: 0)",
			},
			size: {
				type: "number",
				description: "Sayfa başına sonuç sayısı (varsayılan: 20, max: 100)",
			},
		},
		required: [],
	},
}

const STATUS_ICON: Record<string, string> = {
	New: "🆕",
	Approved: "✅",
	ReadyToShip: "📦",
	Completed: "🏁",
	Cancelled: "❌",
	Rejected: "⛔",
	PartialShipping: "⚡",
}

export async function handleGetOrders(
	client: N11Client,
	args: {
		startDate?: string
		endDate?: string
		status?: OrderStatus
		page?: number
		size?: number
	},
): Promise<string> {
	const page = args.page ?? 0
	const size = Math.min(args.size ?? 20, 100)

	const body: Record<string, unknown> = {
		pagingData: { currentPage: page, pageSize: size },
	}
	if (args.status) body.status = args.status
	if (args.startDate) body.period = { startDate: args.startDate, ...(args.endDate ? { endDate: args.endDate } : {}) }

	const data = await client.post<OrderListResponse>("/OrderService/GetOrderList", body)

	const paging = data.pagingData
	// N11 tek sonuçta dizi yerine obje döndürebilir
	const rawOrders = data.orderList?.order
	const orders: N11Order[] = rawOrders
		? Array.isArray(rawOrders) ? rawOrders : [rawOrders]
		: []

	if (orders.length === 0) {
		return `Sipariş bulunamadı (durum: ${args.status ?? "hepsi"}).`
	}

	const lines = [
		`Toplam: ${paging.totalCount} sipariş | Sayfa ${paging.currentPage + 1}/${paging.pageCount}`,
		"",
	]

	for (const order of orders) {
		const icon = STATUS_ICON[order.status] ?? "❓"
		lines.push(
			`${icon} Sipariş #${order.orderNumber}`,
			`  Müşteri: ${order.citizen.fullName} — ${order.shipmentAddress.city}/${order.shipmentAddress.district}`,
			`  Durum: ${order.status} | Tarih: ${order.createDate}`,
			`  Tutar: ${order.totalAmount.toFixed(2)} TL`,
			`  Ürünler:`,
		)
		for (const item of order.orderItems) {
			lines.push(
				`    • ${item.productName} (SKU: ${item.productSellerCode}) x${item.quantity} — ${item.totalPrice.toFixed(2)} TL`,
			)
		}
		lines.push("")
	}

	return lines.join("\n").trimEnd()
}
