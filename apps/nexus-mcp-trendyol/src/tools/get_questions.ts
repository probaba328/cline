import type { TrendyolClient } from "../api/client.js"
import type { QuestionListResponse } from "../types/trendyol.js"

export const GET_QUESTIONS_TOOL = {
	name: "get_questions",
	description: "Bekleyen müşteri sorularını getir. Maksimum 50 soru sayfalanmış şekilde.",
	inputSchema: {
		type: "object" as const,
		properties: {
			page: {
				type: "number",
				description: "Sayfa numarası (0'dan başlar)",
				default: 0,
			},
			status: {
				type: "string",
				enum: ["waiting_for_answer", "answered", "all"],
				description: "Soru durumu filtresi",
				default: "waiting_for_answer",
			},
		},
		required: [],
	},
}

export async function getQuestions(
	client: TrendyolClient,
	args: { page?: number; status?: string },
): Promise<string> {
	const page = args.page ?? 0
	const size = 50 // Trendyol max
	const status = args.status ?? "waiting_for_answer"

	const params = new URLSearchParams({
		page: String(page),
		size: String(size),
	})

	if (status !== "all") {
		params.set("status", status)
	}

	const data = await client.get<QuestionListResponse>(`/questions?${params}`)

	const questions = data.content.map((q) => ({
		id: q.id,
		question: q.text,
		product: q.productName,
		barcode: q.productBarcode,
		customer: `${q.customerFirstName} ${q.customerLastName}`.trim(),
		date: new Date(q.createdDate).toISOString(),
		status: q.status,
	}))

	return JSON.stringify(
		{
			totalElements: data.totalElements,
			totalPages: data.totalPages,
			questions,
		},
		null,
		2,
	)
}
