import type { N11Client } from "../api/client.js"

export const ANSWER_QUESTION_TOOL = {
	name: "answer_question",
	description: "N11'deki müşteri sorusunu yanıtlar.",
	inputSchema: {
		type: "object" as const,
		properties: {
			questionId: {
				type: "string",
				description: "Yanıtlanacak soru ID'si (get_questions ile alınır)",
			},
			answer: {
				type: "string",
				description: "Yanıt metni (en az 10 karakter)",
			},
		},
		required: ["questionId", "answer"],
	},
}

interface AnswerQuestionResponse {
	result: { status: string; errorCode?: string; errorMessage?: string }
}

export async function handleAnswerQuestion(
	client: N11Client,
	args: { questionId: string; answer: string },
): Promise<string> {
	const answer = args.answer.trim()

	if (answer.length < 10) {
		return "Hata: Yanıt en az 10 karakter uzunluğunda olmalıdır."
	}

	await client.post<AnswerQuestionResponse>("/QuestionAnswerService/AnswerQuestion", {
		questionId: args.questionId,
		answer,
	})

	return [
		`✅ Soru yanıtlandı`,
		`Soru ID: ${args.questionId}`,
		`Yanıt: ${answer.slice(0, 100)}${answer.length > 100 ? "…" : ""}`,
	].join("\n")
}
