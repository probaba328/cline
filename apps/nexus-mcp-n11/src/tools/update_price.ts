import type { N11Client } from "../api/client.js"

export const UPDATE_PRICE_TOOL = {
	name: "update_price",
	description: "N11 ürününün fiyatını günceller.",
	inputSchema: {
		type: "object" as const,
		properties: {
			productId: {
				type: "string",
				description: "N11 ürün ID'si (get_products ile alınır)",
			},
			price: {
				type: "number",
				description: "Yeni satış fiyatı (TL, minimum 0.01)",
			},
			currencyType: {
				type: "string",
				description: "Para birimi (varsayılan: TL)",
				enum: ["TL", "USD", "EUR"],
			},
			discountPercentage: {
				type: "number",
				description: "İndirim yüzdesi (0-90 arası, opsiyonel)",
			},
		},
		required: ["productId", "price"],
	},
}

interface UpdatePriceResponse {
	result: { status: string; errorCode?: string; errorMessage?: string }
}

export async function handleUpdatePrice(
	client: N11Client,
	args: { productId: string; price: number; currencyType?: string; discountPercentage?: number },
): Promise<string> {
	if (args.price < 0.01) {
		return "Hata: Fiyat en az 0.01 TL olmalıdır."
	}

	if (args.discountPercentage !== undefined && (args.discountPercentage < 0 || args.discountPercentage > 90)) {
		return "Hata: İndirim yüzdesi 0-90 arasında olmalıdır."
	}

	const body: Record<string, unknown> = {
		productId: args.productId,
		price: args.price,
		currencyType: args.currencyType ?? "TL",
	}

	if (args.discountPercentage) {
		body.discount = {
			type: 2,            // 2 = Yüzde
			value: args.discountPercentage,
		}
	}

	await client.post<UpdatePriceResponse>("/ProductService/UpdateProductPrice", body)

	const lines = [
		`✅ Fiyat güncellendi`,
		`Ürün ID: ${args.productId}`,
		`Yeni fiyat: ${args.price} ${args.currencyType ?? "TL"}`,
	]
	if (args.discountPercentage) {
		lines.push(`İndirim: %${args.discountPercentage}`)
	}

	return lines.join("\n")
}
