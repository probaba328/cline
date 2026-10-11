import type { HepsiburadaClient } from "../api/client.js"
import type { ListingListResponse } from "../types/hepsiburada.js"

export const GET_LISTINGS_TOOL = {
	name: "get_listings",
	description: "Hepsiburada mağazanızdaki ürün listelerini (listing) getirir. Stok, fiyat ve ürün durumu bilgilerini içerir.",
	inputSchema: {
		type: "object" as const,
		properties: {
			offset: {
				type: "number",
				description: "Sayfalama başlangıç noktası (varsayılan: 0)",
			},
			limit: {
				type: "number",
				description: "Sayfa başına sonuç sayısı (varsayılan: 50, max: 100)",
			},
			available: {
				type: "boolean",
				description: "Sadece aktif ürünleri getir (opsiyonel)",
			},
		},
		required: [],
	},
}

export async function handleGetListings(
	client: HepsiburadaClient,
	args: { offset?: number; limit?: number; available?: boolean },
): Promise<string> {
	const offset = args.offset ?? 0
	const limit = Math.min(args.limit ?? 50, 100)

	let url = `/product/api/products/all-listings?merchantId=${client.mid}&offset=${offset}&limit=${limit}`
	if (args.available !== undefined) {
		url += `&available=${args.available}`
	}

	const data = await client.get<ListingListResponse>(url)

	const lines = [
		`Toplam: ${data.totalCount} listing | Sayfa: offset=${offset}, limit=${limit}`,
		"",
	]

	for (const item of data.data) {
		lines.push(
			`SKU: ${item.merchantSku} | HB SKU: ${item.hepsiburadaSku}`,
			`  Ürün: ${item.productName}`,
			`  Kategori: ${item.categoryName} (${item.categoryId})`,
			`  Fiyat: ${item.price} ${item.currency} | Satış: ${item.salePrice} ${item.currency}`,
			`  Stok: ${item.stock} | Aktif: ${item.available ? "✅" : "❌"}`,
			"",
		)
	}

	return lines.join("\n").trimEnd()
}
