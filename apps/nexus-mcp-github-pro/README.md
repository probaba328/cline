# nexus-mcp-github-pro

GitHub hesabınızı Nexus ile yönetmenizi sağlayan MCP (Model Context Protocol) sunucusu.
PR inceleme, issue yönetimi, CI/CD takibi ve repo analizini doğal dille yapın.

## Araçlar

| Araç | Açıklama |
|------|----------|
| `get_pull_requests` | PR'ları listeler (durum, yazar filtresi) |
| `review_pull_request` | PR'a yorum ekler veya approve/request_changes gönderir |
| `get_issues` | Issue'ları listeler (durum, etiket filtresi) |
| `create_issue` | Yeni issue oluşturur |
| `get_workflow_runs` | GitHub Actions çalışmalarını listeler |
| `get_failed_workflows` | Başarısız CI adımlarını detaylıca gösterir |
| `get_repo_stats` | Stars, forks, katkıcılar, commit sayısı |
| `create_branch` | Yeni branch oluşturur |

## Kurulum

### 1. Personal Access Token Oluştur

**github.com → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)**

Gerekli scope'lar:
- `repo` — Repo okuma/yazma
- `workflow` — GitHub Actions yönetimi
- `read:org` — Org repo'larına erişim (opsiyonel)

### 2. Bağımlılıkları Yükle ve Derle

```bash
cd nexus-mcp-github-pro
npm install
npm run build
```

### 3. Ortam Değişkenleri

```bash
cp .env.example .env
```

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_DEFAULT_OWNER=your-github-username   # opsiyonel
```

## Nexus ile Kullanım

`~/.nexus/mcp-settings.json`:

```json
{
  "mcpServers": {
    "github-pro": {
      "command": "node",
      "args": ["/tam/yol/nexus-mcp-github-pro/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxx",
        "GITHUB_DEFAULT_OWNER": "your-username"
      }
    }
  }
}
```

## Örnek Kullanım

```
owner/my-repo'daki açık PR'ları listele
```

```
my-repo'daki son başarısız CI çalışmalarını göster, hangi adımlar hata vermiş?
```

```
my-repo'ya 'Bug: login sayfası çöküyor' başlıklı bir issue aç, etiket: bug
```

```
my-repo'ya feature/new-login branch'i aç, main'den dallan
```

```
my-repo/repo'nun istatistiklerini göster
```

## Teknik Detaylar

### Kimlik Doğrulama

Bearer Token (Personal Access Token). Token hiçbir log'a yazılmaz, stack trace
kullanıcıya gösterilmez.

### Rate Limiting

GitHub limiti: **5000 istek/saat**. İstemci tarafında kayan pencere (rolling 1-hour)
ile takip edilir. GitHub'ın `x-ratelimit-remaining` header'ı ile senkronize edilir.
429/500 alındığında üstel geri çekilme (exponential backoff) uygulanır.

### Repo Formatı

Tüm araçlarda `repo` parametresi `owner/repo` formatında verilir:
- `octocat/Hello-World`
- `my-org/my-project`

`GITHUB_DEFAULT_OWNER` ayarlıysa sadece `repo` adı da yeterlidir.

### Güvenlik

| Kural | Durum |
|-------|-------|
| Token loglanmaz | ✅ |
| Stack trace gösterilmez | ✅ |
| Token bellekte tutulur, diske yazılmaz | ✅ |
| HTTPS zorunlu | ✅ |
| Hata mesajlarında token içermez | ✅ |

## Geliştirme

```bash
# TypeScript izleme modunda
npm run dev

# Tip kontrolü
npm run typecheck

# Derleme
npm run build
```
