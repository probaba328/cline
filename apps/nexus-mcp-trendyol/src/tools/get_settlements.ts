import type { TrendyolClient } from "../api/client.js"
import type { SettlementResponse } from "../types/trendyol.js"

export const GET_SETTLEMENTS_TOOL = {
	name: "get_settlements",
	description: "Hakediş raporlarını getir. Tarih aralığı ile filtrele.",
	inputSchema: {
		type: "object" as const,
		properties: {
			startDate: {
				type: "string",
				description: "Başlangıç tarihi (ISO 8601: 2024-01-01)",
			},
			endDate: {
				type: "string",
				description: "Bitiş tarihi (ISO 8601: 2024-01-31)",
			},
			page: {
				type: "number",
				description: "Sayfa numarası (0'dan başlar)",
				default: 0,
			},
			size: {
				type: "number",
				description: "Sayfa başına kayıt sayısı (maks 500)",
				default: 100,
			},
		},
		required: [],
	},
}

export async function getSettlements(
	client: TrendyolClient,
	args: { startDate?: string; endDate?: string; page?: number; size?: number },
): Promise<string> {
	const page = args.page ?? 0
	const size = Math.min(args.size ?? 100, 500)

	const params = new URLSearchParams({
		page: String(page),
		size: String(size),
	})

	if (args.startDate) params.set("startDate", String(toEpochMs(args.startDate)))
	if (args.endDate) params.set("endDate", String(toEpochMs(args.endDate)))

	const data = await client.get<SettlementResponse>(`/finance/settlements?${params}`)

	const totalNet = data.content.reduce(
		(s, r) => s + (r.totalPrice - r.totalCommission - r.totalDiscount + r.totalTax),
		0,
	)

	return JSON.stringify(
		{
			totalElements: data.totalElements,
			summaryTL: {
				totalPrice: round2(data.content.reduce((s, r) => s + r.totalPrice, 0)),
				totalCommission: round2(data.content.reduce((s, r) => s + r.totalCommission, 0)),
				totalDiscount: round2(data.content.reduce((s, r) => s + r.totalDiscount, 0)),
				netEarnings: round2(totalNet),
			},
			settlements: data.content.map((r) => ({
				settlementId: r.settlementId,
				paymentOrderId: r.paymentOrderId,
				transactionDate: new Date(r.transactionDate).toISOString(),
				totalPrice: r.totalPrice,
				totalCommission: r.totalCommission,
				totalDiscount: r.totalDiscount,
				totalTax: r.totalTax,
			})),
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

function round2(n: number): number {
	return Math.round(n * 100) / 100
}
