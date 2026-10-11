import type { TrendyolClient } from "../api/client.js"
import type { ProductListResponse } from "../types/trendyol.js"

export const GET_PRODUCTS_TOOL = {
	name: "get_products",
	description: "Mağazadaki ürünleri listele. Sayfalama, boyut ve duruma göre filtrele.",
	inputSchema: {
		type: "object" as const,
		properties: {
			page: {
				type: "number",
				description: "Sayfa numarası (0'dan başlar)",
				default: 0,
			},
			size: {
				type: "number",
				description: "Sayfa başına ürün sayısı (maks 200)",
				default: 50,
			},
			status: {
				type: "string",
				enum: ["approved", "rejected", "draft", "all"],
				description: "Ürün durumu filtresi",
				default: "all",
			},
		},
		required: [],
	},
}

export async function getProducts(
	client: TrendyolClient,
	args: { page?: number; size?: number; status?: string },
): Promise<string> {
	const page = args.page ?? 0
	const size = Math.min(args.size ?? 50, 200)
	const status = args.status ?? "all"

	let path = `/products?page=${page}&size=${size}`
	if (status !== "all") {
		const approvedMap: Record<string, string> = {
			approved: "approved=true",
			rejected: "rejected=true",
			draft: "archived=false&approved=false&rejected=false",
		}
		if (approvedMap[status]) path += `&${approvedMap[status]}`
	}

	const data = await client.get<ProductListResponse>(path)

	const summary = data.content.map((p) => ({
		barcode: p.barcode,
		title: p.title.slice(0, 60),
		quantity: p.quantity,
		salePrice: p.salePrice,
		listPrice: p.listPrice,
		onSale: p.onSale,
		approved: p.approved,
	}))

	return JSON.stringify(
		{
			totalElements: data.totalElements,
			totalPages: data.totalPages,
			page: data.page,
			size: data.size,
			products: summary,
		},
		null,
		2,
	)
}
