import type { GitHubClient } from "../api/client.js"
import type { PullRequest, PRState } from "../types/github.js"

export const GET_PULL_REQUESTS_TOOL = {
	name: "get_pull_requests",
	description: "GitHub repo'sundaki pull request'leri listeler. Durum, yazar ve etiket filtresi destekler.",
	inputSchema: {
		type: "object" as const,
		properties: {
			repo: {
				type: "string",
				description: "Repo adı: 'owner/repo' veya sadece 'repo' (GITHUB_DEFAULT_OWNER ayarlıysa)",
			},
			state: {
				type: "string",
				description: "PR durumu: open | closed | all (varsayılan: open)",
				enum: ["open", "closed", "all"],
			},
			author: {
				type: "string",
				description: "Yazar GitHub kullanıcı adı (opsiyonel filtre)",
			},
			limit: {
				type: "number",
				description: "Maksimum sonuç sayısı (varsayılan: 20, max: 100)",
			},
		},
		required: ["repo"],
	},
}

export async function handleGetPullRequests(
	client: GitHubClient,
	args: { repo: string; state?: PRState; author?: string; limit?: number },
): Promise<string> {
	const { owner, repo } = client.parseRepo(args.repo)
	const state = args.state ?? "open"
	const limit = Math.min(args.limit ?? 20, 100)

	const params = new URLSearchParams({ state, per_page: String(limit) })
	const prs = await client.get<PullRequest[]>(
		`/repos/${owner}/${repo}/pulls?${params.toString()}`,
	)

	const filtered = args.author
		? prs.filter((pr) => pr.user.login.toLowerCase() === args.author!.toLowerCase())
		: prs

	if (filtered.length === 0) {
		return `${owner}/${repo} için ${state} PR bulunamadı.`
	}

	const lines = [`${owner}/${repo} — ${filtered.length} PR (${state})`, ""]

	for (const pr of filtered) {
		const draft = pr.draft ? " [DRAFT]" : ""
		const labels = pr.labels.map((l) => `#${l.name}`).join(" ")
		lines.push(
			`#${pr.number}${draft} ${pr.title}`,
			`  Yazar: @${pr.user.login} | ${pr.head.ref} → ${pr.base.ref}`,
			`  Durum: ${pr.state} | Tarih: ${pr.created_at.slice(0, 10)}`,
			`  +${pr.additions} -${pr.deletions} | ${pr.changed_files} dosya | ${pr.commits} commit`,
			labels ? `  Etiketler: ${labels}` : "",
			`  🔗 ${pr.html_url}`,
			"",
		)
	}

	return lines.filter((l) => l !== undefined).join("\n").trimEnd()
}
