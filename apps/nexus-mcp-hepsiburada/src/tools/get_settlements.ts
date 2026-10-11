import type { HepsiburadaClient } from "../api/client.js"
import type { SettlementResponse } from "../types/hepsiburada.js"

export const GET_SETTLEMENTS_TOOL = {
	name: "get_settlements",
	description: "Hepsiburada satıcı ödemelerini (mutabakat/settlement) listeler. Sipariş, komisyon ve net ödeme bilgilerini içerir.",
	inputSchema: {
		type: "object" as const,
		properties: {
			startDate: {
				type: "string",
				description: "Başlangıç tarihi (YYYY-MM-DD formatında, ör. 2024-01-01)",
			},
			endDate: {
				type: "string",
				description: "Bitiş tarihi (YYYY-MM-DD formatında)",
			},
			offset: {
				type: "number",
				description: "Sayfalama başlangıç noktası (varsayılan: 0)",
			},
			limit: {
				type: "number",
				description: "Sayfa başına sonuç sayısı (varsayılan: 50, max: 100)",
			},
		},
		required: [],
	},
}

export async function handleGetSettlements(
	client: HepsiburadaClient,
	args: {
		startDate?: string
		endDate?: string
		offset?: number
		limit?: number
	},
): Promise<string> {
	const offset = args.offset ?? 0
	const limit = Math.min(args.limit ?? 50, 100)

	const params = new URLSearchParams({
		merchantId: client.mid,
		offset: String(offset),
		limit: String(limit),
	})
	if (args.startDate) params.append("startDate", args.startDate)
	if (args.endDate) params.append("endDate", args.endDate)

	const data = await client.get<SettlementResponse>(`/finance/api/settlements?${params.toString()}`)

	const lines = [
		`Toplam: ${data.totalCount} kayıt | offset=${offset}, limit=${limit}`,
		"",
	]

	let totalNet = 0
	let totalCommission = 0

	for (const s of data.data) {
		totalNet += s.netAmount
		totalCommission += s.commission
		lines.push(
			`${s.settlementDate} | Sipariş: ${s.orderNumber} | Paket: ${s.packageNumber}`,
			`  Ürün: ${s.productName} (SKU: ${s.sku})`,
			`  Satış: ${s.saleAmount.toFixed(2)} ${s.currency} | Komisyon: ${s.commission.toFixed(2)} | Net: ${s.netAmount.toFixed(2)}`,
			"",
		)
	}

	if (data.data.length > 0) {
		lines.push(
			`── Sayfa Özeti ──`,
			`Toplam Komisyon: ${totalCommission.toFixed(2)} | Toplam Net: ${totalNet.toFixed(2)}`,
		)
	}

	return lines.join("\n").trimEnd()
}
