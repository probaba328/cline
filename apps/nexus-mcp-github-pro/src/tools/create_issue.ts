import type { GitHubClient } from "../api/client.js"
import type { CreatedIssue } from "../types/github.js"

export const CREATE_ISSUE_TOOL = {
	name: "create_issue",
	description: "GitHub repo'sunda yeni bir issue oluşturur.",
	inputSchema: {
		type: "object" as const,
		properties: {
			repo: {
				type: "string",
				description: "Repo adı: 'owner/repo' formatında",
			},
			title: {
				type: "string",
				description: "Issue başlığı",
			},
			body: {
				type: "string",
				description: "Issue açıklaması (Markdown destekler)",
			},
			labels: {
				type: "array",
				description: "Eklenecek etiket isimleri listesi (ör. ['bug', 'help wanted'])",
				items: { type: "string" },
			},
			assignees: {
				type: "array",
				description: "Atanacak GitHub kullanıcı adları listesi",
				items: { type: "string" },
			},
		},
		required: ["repo", "title"],
	},
}

export async function handleCreateIssue(
	client: GitHubClient,
	args: { repo: string; title: string; body?: string; labels?: string[]; assignees?: string[] },
): Promise<string> {
	const { owner, repo } = client.parseRepo(args.repo)

	const payload: Record<string, unknown> = { title: args.title }
	if (args.body) payload.body = args.body
	if (args.labels?.length) payload.labels = args.labels
	if (args.assignees?.length) payload.assignees = args.assignees

	const issue = await client.post<CreatedIssue>(`/repos/${owner}/${repo}/issues`, payload)

	const lines = [
		`✅ Issue oluşturuldu: #${issue.number}`,
		`Başlık: ${issue.title}`,
		`Repo: ${owner}/${repo}`,
		`🔗 ${issue.html_url}`,
	]

	if (args.labels?.length) {
		lines.push(`Etiketler: ${args.labels.join(", ")}`)
	}

	return lines.join("\n")
}
