import type { N11Client } from "../api/client.js"
import type { ProductListResponse, ProductStatus } from "../types/n11.js"

export const GET_PRODUCTS_TOOL = {
	name: "get_products",
	description: "N11 mağazanızdaki ürünleri listeler. Sayfalama ve durum filtresi destekler.",
	inputSchema: {
		type: "object" as const,
		properties: {
			page: {
				type: "number",
				description: "Sayfa numarası, 0'dan başlar (varsayılan: 0)",
			},
			size: {
				type: "number",
				description: "Sayfa başına ürün sayısı (varsayılan: 20, max: 100)",
			},
			status: {
				type: "string",
				description: "Ürün durumu filtresi: Active | Suspended | Rejected | Draft | WaitingForApproval",
				enum: ["Active", "Suspended", "Rejected", "Draft", "WaitingForApproval"],
			},
		},
		required: [],
	},
}

export async function handleGetProducts(
	client: N11Client,
	args: { page?: number; size?: number; status?: ProductStatus },
): Promise<string> {
	const page = args.page ?? 0
	const size = Math.min(args.size ?? 20, 100)

	const body: Record<string, unknown> = {
		pagingData: { currentPage: page, pageSize: size },
	}
	if (args.status) body.status = args.status

	const data = await client.post<ProductListResponse>("/ProductService/GetProductList", body)

	const paging = data.pagingData
	const products = data.productList?.products ?? []

	if (products.length === 0) {
		return `Ürün bulunamadı (sayfa ${page}, durum: ${args.status ?? "hepsi"}).`
	}

	const lines = [
		`Toplam: ${paging.totalCount} ürün | Sayfa ${paging.currentPage + 1}/${paging.pageCount}`,
		"",
	]

	for (const p of products) {
		const stock = p.stockItems?.reduce((sum, s) => sum + s.quantity, 0) ?? 0
		const statusIcon = p.approvalStatus === "Active" ? "✅" : p.approvalStatus === "Rejected" ? "❌" : "⏳"
		lines.push(
			`${statusIcon} [${p.productSellerCode}] ${p.title}`,
			`  Kategori: ${p.category.name}`,
			`  Fiyat: ${p.price} ${p.currencyType} | Stok: ${stock} adet`,
			`  Durum: ${p.approvalStatus}`,
			"",
		)
	}

	return lines.join("\n").trimEnd()
}
