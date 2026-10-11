import type { GitHubClient } from "../api/client.js"
import type { RepoInfo, Contributor } from "../types/github.js"

export const GET_REPO_STATS_TOOL = {
	name: "get_repo_stats",
	description: "GitHub repo'sunun istatistiklerini getirir: stars, forks, commit sayısı, katkıda bulunanlar.",
	inputSchema: {
		type: "object" as const,
		properties: {
			repo: {
				type: "string",
				description: "Repo adı: 'owner/repo' formatında",
			},
		},
		required: ["repo"],
	},
}

interface CommitActivityWeek {
	total: number
	week: number
}

export async function handleGetRepoStats(
	client: GitHubClient,
	args: { repo: string },
): Promise<string> {
	const { owner, repo } = client.parseRepo(args.repo)

	// Repo bilgisi ve katkıcıları paralel getir
	const [info, contributors] = await Promise.all([
		client.get<RepoInfo>(`/repos/${owner}/${repo}`),
		client.get<Contributor[]>(`/repos/${owner}/${repo}/contributors?per_page=10`).catch(() => [] as Contributor[]),
	])

	// Commit aktivitesi (son 52 hafta)
	let totalCommits = 0
	try {
		const activity = await client.get<CommitActivityWeek[]>(
			`/repos/${owner}/${repo}/stats/commit_activity`,
		)
		if (Array.isArray(activity)) {
			totalCommits = activity.reduce((sum, w) => sum + (w.total ?? 0), 0)
		}
	} catch {
		// Hesaplanıyor olabilir (GitHub 202 döner), görmezden gel
	}

	const sizeKB = info.size
	const sizeMB = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`

	const lines = [
		`📊 ${info.full_name}`,
		info.description ? `   ${info.description}` : "",
		"",
		`⭐ Stars: ${info.stargazers_count.toLocaleString()}`,
		`🍴 Forks: ${info.forks_count.toLocaleString()}`,
		`👁️  Watchers: ${info.watchers_count.toLocaleString()}`,
		`🐛 Açık Issue: ${info.open_issues_count.toLocaleString()}`,
		totalCommits > 0 ? `📝 Commit (son 1 yıl): ${totalCommits.toLocaleString()}` : "",
		"",
		`Dil: ${info.language ?? "belirtilmemiş"}`,
		`Boyut: ${sizeMB}`,
		`Görünürlük: ${info.visibility}`,
		`Default branch: ${info.default_branch}`,
		info.topics.length ? `Konular: ${info.topics.join(", ")}` : "",
		"",
		`Oluşturuldu: ${info.created_at.slice(0, 10)}`,
		`Son push: ${info.pushed_at.slice(0, 10)}`,
		`🔗 ${info.html_url}`,
	]

	if (contributors.length > 0) {
		lines.push("", "👥 En çok katkıda bulunanlar:")
		for (const c of contributors.slice(0, 10)) {
			lines.push(`   @${c.login} — ${c.contributions.toLocaleString()} commit`)
		}
	}

	return lines.filter((l) => l !== undefined).join("\n").trimEnd()
}
