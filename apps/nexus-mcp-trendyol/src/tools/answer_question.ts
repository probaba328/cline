import type { TrendyolClient } from "../api/client.js"

export const ANSWER_QUESTION_TOOL = {
	name: "answer_question",
	description: "Müşteri sorusunu yanıtla. questionId ve answer metni gerekli.",
	inputSchema: {
		type: "object" as const,
		properties: {
			questionId: {
				type: "number",
				description: "Yanıtlanacak sorunun ID'si (get_questions ile öğrenilir)",
			},
			answer: {
				type: "string",
				description: "Müşteriye verilecek yanıt metni",
				minLength: 1,
				maxLength: 2000,
			},
		},
		required: ["questionId", "answer"],
	},
}

export async function answerQuestion(
	client: TrendyolClient,
	args: { questionId: number; answer: string },
): Promise<string> {
	if (!args.questionId) {
		throw new Error("questionId gerekli")
	}
	const answer = args.answer?.trim()
	if (!answer) {
		throw new Error("Yanıt metni boş olamaz")
	}
	if (answer.length > 2000) {
		throw new Error("Yanıt metni en fazla 2000 karakter olabilir")
	}

	await client.post<unknown>(`/questions/${args.questionId}/answers`, { text: answer })

	return JSON.stringify(
		{
			success: true,
			message: `${args.questionId} numaralı soru yanıtlandı`,
		},
		null,
		2,
	)
}
