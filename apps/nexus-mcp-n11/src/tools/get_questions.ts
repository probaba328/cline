import type { N11Client } from "../api/client.js"
import type { QuestionListResponse, N11Question } from "../types/n11.js"

export const GET_QUESTIONS_TOOL = {
	name: "get_questions",
	description: "N11 müşteri sorularını listeler. Yanıtlanmamış sorular önce gösterilir.",
	inputSchema: {
		type: "object" as const,
		properties: {
			status: {
				type: "string",
				description: "Soru durumu: WaitingAnswer | Answered | Expired (varsayılan: WaitingAnswer)",
				enum: ["WaitingAnswer", "Answered", "Expired"],
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

export async function handleGetQuestions(
	client: N11Client,
	args: { status?: string; page?: number; size?: number },
): Promise<string> {
	const page = args.page ?? 0
	const size = Math.min(args.size ?? 20, 100)

	const body: Record<string, unknown> = {
		pagingData: { currentPage: page, pageSize: size },
		status: args.status ?? "WaitingAnswer",
	}

	const data = await client.post<QuestionListResponse>("/QuestionAnswerService/GetQuestionList", body)

	const paging = data.pagingData
	const rawQuestions = data.questionList?.question
	const questions: N11Question[] = rawQuestions
		? Array.isArray(rawQuestions) ? rawQuestions : [rawQuestions]
		: []

	if (questions.length === 0) {
		return `Soru bulunamadı (durum: ${args.status ?? "WaitingAnswer"}).`
	}

	const lines = [
		`Toplam: ${paging.totalCount} soru | Sayfa ${paging.currentPage + 1}/${paging.pageCount}`,
		"",
	]

	for (const q of questions) {
		const statusIcon = q.status === "WaitingAnswer" ? "❓" : q.status === "Answered" ? "✅" : "⏰"
		lines.push(
			`${statusIcon} ID: ${q.id}`,
			`  Ürün: ${q.productTitle}`,
			`  Soru: ${q.question}`,
			`  Tarih: ${q.questionDate}`,
		)
		if (q.answer) lines.push(`  Yanıt: ${q.answer}`)
		lines.push("")
	}

	return lines.join("\n").trimEnd()
}
