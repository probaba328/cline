import type { GitHubClient } from "../api/client.js"

export const REVIEW_PULL_REQUEST_TOOL = {
	name: "review_pull_request",
	description: "GitHub PR'ına yorum ekler. Genel yorum veya approve/request_changes review'u destekler.",
	inputSchema: {
		type: "object" as const,
		properties: {
			repo: {
				type: "string",
				description: "Repo adı: 'owner/repo' formatında",
			},
			pr_number: {
				type: "number",
				description: "PR numarası",
			},
			comment: {
				type: "string",
				description: "Eklenecek yorum metni",
			},
			event: {
				type: "string",
				description: "Review türü: COMMENT (sadece yorum) | APPROVE (onayla) | REQUEST_CHANGES (değişiklik iste) — varsayılan: COMMENT",
				enum: ["COMMENT", "APPROVE", "REQUEST_CHANGES"],
			},
		},
		required: ["repo", "pr_number", "comment"],
	},
}

interface ReviewResponse {
	id: number
	html_url: string
	state: string
	submitted_at: string
}

export async function handleReviewPullRequest(
	client: GitHubClient,
	args: { repo: string; pr_number: number; comment: string; event?: "COMMENT" | "APPROVE" | "REQUEST_CHANGES" },
): Promise<string> {
	const { owner, repo } = client.parseRepo(args.repo)
	const event = args.event ?? "COMMENT"

	const payload = {
		body: args.comment,
		event,
	}

	const review = await client.post<ReviewResponse>(
		`/repos/${owner}/${repo}/pulls/${args.pr_number}/reviews`,
		payload,
	)

	const eventLabel: Record<string, string> = {
		COMMENT: "💬 Yorum eklendi",
		APPROVE: "✅ PR onaylandı",
		REQUEST_CHANGES: "🔄 Değişiklik istendi",
	}

	return [
		`${eventLabel[event] ?? "Review gönderildi"}`,
		`PR: ${owner}/${repo}#${args.pr_number}`,
		`Review ID: ${review.id}`,
		`🔗 ${review.html_url}`,
	].join("\n")
}
