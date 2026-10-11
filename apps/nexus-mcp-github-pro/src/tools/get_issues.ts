import type { GitHubClient } from "../api/client.js"
import type { Issue, IssueState } from "../types/github.js"

export const GET_ISSUES_TOOL = {
	name: "get_issues",
	description: "GitHub repo'sundaki issue'ları listeler. Durum ve etiket filtresi destekler.",
	inputSchema: {
		type: "object" as const,
		properties: {
			repo: {
				type: "string",
				description: "Repo adı: 'owner/repo' veya sadece 'repo'",
			},
			state: {
				type: "string",
				description: "Issue durumu: open | closed | all (varsayılan: open)",
				enum: ["open", "closed", "all"],
			},
			labels: {
				type: "string",
				description: "Virgülle ayrılmış etiket listesi (ör. bug,enhancement)",
			},
			limit: {
				type: "number",
				description: "Maksimum sonuç sayısı (varsayılan: 20, max: 100)",
			},
		},
		required: ["repo"],
	},
}

export async function handleGetIssues(
	client: GitHubClient,
	args: { repo: string; state?: IssueState; labels?: string; limit?: number },
): Promise<string> {
	const { owner, repo } = client.parseRepo(args.repo)
	const state = args.state ?? "open"
	const limit = Math.min(args.limit ?? 20, 100)

	const params = new URLSearchParams({ state, per_page: String(limit) })
	if (args.labels) params.append("labels", args.labels)

	// GitHub /issues endpoint PR'ları da döndürür; sadece gerçek issue'lar lazım
	const all = await client.get<(Issue & { pull_request?: unknown })[]>(
		`/repos/${owner}/${repo}/issues?${params.toString()}`,
	)
	const issues = all.filter((i) => !i.pull_request)

	if (issues.length === 0) {
		return `${owner}/${repo} için ${state} issue bulunamadı.`
	}

	const lines = [`${owner}/${repo} — ${issues.length} issue (${state})`, ""]

	for (const issue of issues) {
		const labels = issue.labels.map((l) => `#${l.name}`).join(" ")
		const assignees = issue.assignees.map((a) => `@${a.login}`).join(", ")
		lines.push(
			`#${issue.number} ${issue.title}`,
			`  Yazar: @${issue.user.login} | ${issue.created_at.slice(0, 10)}`,
			labels ? `  Etiketler: ${labels}` : "",
			assignees ? `  Atanan: ${assignees}` : "",
			`  Yorumlar: ${issue.comments}`,
			`  🔗 ${issue.html_url}`,
			"",
		)
	}

	return lines.filter((l) => l !== undefined).join("\n").trimEnd()
}
