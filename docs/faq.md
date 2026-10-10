# Sık Sorulan Sorular — Frequently Asked Questions

---

## Kurulum ve Ayarlar / Installation & Setup

---

**S: Nexus ile Cline arasındaki fark nedir?**
**Q: What's the difference between Nexus and Cline?**

Nexus, [Cline](https://github.com/cline/cline) projesinin uluslararasılaştırma odaklı bir fork'udur. Temel farklılıklar:

| Özellik | Cline | Nexus |
|---------|-------|-------|
| Arayüz dili | Yalnızca İngilizce | 13 dil, otomatik algılama |
| Telemetry | Opt-out (varsayılan açık) | Opt-in (varsayılan kapalı) |
| API key saklama | SecretStorage | SecretStorage (aynı güvence) |

The core agent engine is identical. Nexus adds internationalization, a privacy-first default for telemetry, and an onboarding wizard.

---

**S: Hangi VS Code sürümü gerekli?**
**Q: Which VS Code version is required?**

VS Code **1.101.0** veya üzeri. Sürümünü kontrol etmek için: Help → About.

---

**S: Nexus ücretsiz mi?**
**Q: Is Nexus free?**

Evet — Nexus yazılımı ücretsiz ve açık kaynaklıdır (Apache 2.0).

Ancak, kullandığın AI provider ücretli olabilir. Ücretsiz başlamak için:
- **Google Gemini 2.0 Flash** — AI Studio üzerinden ücretsiz katman
- **Ollama** — tamamen ücretsiz, yerel çalışır
- **OpenRouter** — bazı modeller ücretsizdir

Evet — the Nexus software is free and open source. The AI provider you configure may charge per token.

---

**S: API key'imi girerken emin olmam gereken bir şey var mı?**
**Q: What should I know when entering my API key?**

Key'ler OS keychain'ine (macOS Keychain / Windows Credential Manager / Linux libsecret) şifreli olarak kaydedilir. Hiçbir zaman düz metin olarak diske yazılmaz, log'lara eklenmez veya Nexus sunucularına gönderilmez.

Keys are stored encrypted in the OS keychain. They are never written to disk as plain text, never logged, and never sent to Nexus servers.

---

**S: Nexus'u birden fazla projede / workspace'de kullanabilir miyim?**
**Q: Can I use Nexus across multiple projects / workspaces?**

Evet. API key'ler global olarak saklanır; her workspace ayrı ayar gerektirmez. Farklı provider'lar veya modeller kullanmak istiyorsan her workspace için ayrı yapılandırma yapabilirsin.

Yes. Keys are stored globally. You can configure different providers or models per workspace.

---

## Modeller ve Provider'lar / Models & Providers

---

**S: Hangi AI modelini seçmeliyim?**
**Q: Which AI model should I choose?**

Tam karşılaştırma için [models.md](./models.md) belgesine bak.

Hızlı öneri:
- **Yeni başlıyorsan:** Claude Haiku 3.5 veya Google Gemini 2.0 Flash
- **Karmaşık görevler:** Claude Sonnet 4.5
- **Ücretsiz & çevrimdışı:** Ollama + Qwen2.5-Coder

For a full comparison, see [models.md](./models.md).

---

**S: Ollama kuruyorum ama modeller görünmüyor.**
**Q: I installed Ollama but no models appear.**

Aşağıdakileri kontrol et:

1. Ollama çalışıyor mu?
   ```bash
   ollama serve   # Manuel başlatmak için
   curl http://localhost:11434/api/tags   # Model listesi
   ```
2. En az bir model indirilmiş mi?
   ```bash
   ollama pull qwen2.5-coder
   ollama list
   ```
3. Nexus ayarlarında provider **Ollama** olarak seçili mi?

Check if Ollama is running, a model is downloaded (`ollama list`), and Ollama is selected as the provider in Nexus settings.

---

**S: OpenRouter'da hangi modeller ücretsizdir?**
**Q: Which models on OpenRouter are free?**

Model adının sonundaki `:free` eki ücretsiz olduğunu gösterir. 2026 itibarıyla mevcut ücretsiz modeller:
- `google/gemini-2.0-flash-exp:free`
- `meta-llama/llama-3.3-70b-instruct:free`
- `mistralai/mistral-7b-instruct:free`

Güncel liste: [openrouter.ai/models?order=pricing-asc](https://openrouter.ai/models?order=pricing-asc)

Models ending in `:free` on OpenRouter are free. Check the current list at the link above.

---

**S: Rate limit hatası alıyorum.**
**Q: I'm getting a rate limit error.**

Provider bazında çözümler:
- **Anthropic:** [Kullanım limitleri](https://docs.anthropic.com/en/api/rate-limits) — daha yüksek tier'e geç
- **OpenAI:** Ödeme yöntemi eklenmişse limit yükselir
- **Google:** AI Studio ücretsiz katmanı dakikada 15 istekle sınırlıdır
- **Ollama:** Yerel çalışır, rate limit yoktur

Each provider has different rate limits. Switching to Ollama eliminates rate limits entirely as it runs locally.

---

## Güvenlik ve Gizlilik / Security & Privacy

---

**S: Nexus kodum veya promptlarımı topluyor mu?**
**Q: Does Nexus collect my code or prompts?**

**Hayır.** Nexus hiçbir zaman kaynak kodu, dosya içerikleri, promptlar veya konuşma geçmişi toplamaz.

Telemetry etkinleştirilirse yalnızca **anonim kullanım olayları** toplanır (hangi özellik kullanıldı, token sayısı, hata türleri). Detaylar için [security.md](./security.md).

**No.** Nexus never collects source code, file contents, prompts, or conversation history. See [security.md](./security.md).

---

**S: Telemetry'yi nasıl kapatırım?**
**Q: How do I disable telemetry?**

İki yöntem:

1. **Nexus Ayarları:** Ayarlar → **Gizlilik** → Telemetry toggle'ı kapat
2. **VS Code:** `telemetry.telemetryLevel` → `off`

VS Code ayarı kapalıysa Nexus telemetry de otomatik olarak kapanır.

Two ways: Nexus Settings → Privacy tab, or VS Code's global `telemetry.telemetryLevel: off`.

---

**S: Nexus internete bağlanıyor mu?**
**Q: Does Nexus connect to the internet?**

Yalnızca şu adreslere:
1. Seçtiğin AI provider endpoint'i
2. `https://data.nexus.bot` — yalnızca telemetry açıksa
3. `https://openrouter.ai/api/v1/models` — yalnızca OpenRouter seçiliyse

Ollama veya LM Studio kullanıyorsan ve telemetry kapalıysa Nexus tamamen çevrimdışı çalışır.

Only to your configured AI provider, and optionally the telemetry endpoint. Fully offline with Ollama + telemetry off.

---

## Özellikler / Features

---

**S: Nexus aynı anda birden fazla dosyayı düzenleyebilir mi?**
**Q: Can Nexus edit multiple files at once?**

Evet. Nexus bir görev sırasında istediği kadar dosyayı okuyabilir ve yazabilir. Her değişiklik için ayrı onay istenir; "Approve All" ile toplu onay da verebilirsin.

Yes. Each edit step requires your approval, or you can use "Approve All" for bulk approval.

---

**S: Nexus terminal komutları çalıştırabilir mi?**
**Q: Can Nexus run terminal commands?**

Evet. Nexus, görev sırasında terminal komutları önerebilir (test çalıştırma, bağımlılık kurma vb.). Her komut için onayın istenir.

Güvenlik için: Nexus asla kendi başına `rm -rf`, `sudo` veya yıkıcı komutlar çalıştırmaz — onayın olmadan.

Yes, with your approval for each command.

---

**S: Nexus Plan/Act modları nedir?**
**Q: What are Nexus Plan/Act modes?**

- **Plan Modu:** Nexus önce bir eylem planı oluşturur, uygulamadan önce planı gözden geçirebilirsin
- **Act Modu:** Nexus doğrudan uygulamaya geçer

**Ayrı model kullan:** Ayarlar → AI Modeli → "Use different models for Plan and Act modes" — örneğin Plan için güçlü bir reasoning modeli, Act için daha hızlı/ucuz bir model kullanabilirsin.

Plan mode: Claude drafts a plan first. Act mode: Claude implements directly. You can assign different models to each mode.

---

**S: MCP (Model Context Protocol) nedir?**
**Q: What is MCP (Model Context Protocol)?**

MCP, AI modellerinin harici araçlara ve veri kaynaklarına bağlanmasını sağlayan bir protokoldür. Nexus, MCP sunucularını destekler — veritabanı bağlantısı, web arama, özel araçlar ve daha fazlası için.

MCP sunucuları eklemek için: Nexus paneli → MCP simgesi.

MCP is a protocol for connecting AI models to external tools and data sources. Nexus supports MCP servers for database access, web search, custom tools, and more.

---

## Sorun Giderme / Troubleshooting

---

**S: "Unauthorized" veya "Invalid API key" hatası alıyorum.**
**Q: I'm getting an "Unauthorized" or "Invalid API key" error.**

1. API key'inin doğru kopyalandığını kontrol et (başında/sonunda boşluk olmasın)
2. Provider'ın hesap panelinde key'in aktif olduğunu doğrula
3. Ödeme yöntemi gerekip gerekmediğini kontrol et (bazı provider'lar kart gerektiriyor)
4. Nexus Ayarlar → AI Modeli → key alanını temizle ve yeniden gir

Check for extra spaces, verify the key is active in your provider dashboard, and re-enter it in Nexus settings.

---

**S: Nexus yanıt vermiyor / takıldı.**
**Q: Nexus is not responding / stuck.**

1. Panelin sağ üstündeki `×` ile görevi iptal et
2. VS Code'u yeniden başlat: `Ctrl+Shift+P` → "Developer: Reload Window"
3. Sorun devam ederse: Help → Toggle Developer Tools → Console — hata mesajını kopyala ve GitHub issue aç

Cancel the task with `×`, reload VS Code with "Developer: Reload Window", then check the Developer Console for errors.

---

**S: Nexus'u güncellemek için ne yapmalıyım?**
**Q: How do I update Nexus?**

VS Code, uzantıları otomatik günceller. Manuel güncellemek için: Uzantılar paneli → Nexus → Update.

VS Code auto-updates extensions. Manual update: Extensions panel → Nexus → Update.

---

## Dil ve Çeviri / Language & Translation

---

**S: Arayüz dilini nasıl değiştirebilirim?**
**Q: How do I change the interface language?**

**Yöntem 1 (Önerilen):** VS Code display language'ı değiştir — Nexus otomatik algılar.
`Ctrl+Shift+P` → "Configure Display Language"

**Yöntem 2:** Nexus Ayarlar → **Genel** → Tercih Edilen Dil dropdown'ı.

Change VS Code's display language (Configure Display Language), or set it manually in Nexus Settings → General.

---

**S: Kendi dilimde çeviri eksik, nasıl katkıda bulunabilirim?**
**Q: My language has missing translations. How can I contribute?**

[CONTRIBUTING_TRANSLATION.md](../CONTRIBUTING_TRANSLATION.md) belgesini oku. Teknik bilgi gerekmeden Crowdin üzerinden veya GitHub PR açarak katkıda bulunabilirsin.

See [CONTRIBUTING_TRANSLATION.md](../CONTRIBUTING_TRANSLATION.md). You can contribute via Crowdin (no coding required) or a GitHub PR.

---

**S: Nexus benim dilimi desteklemiyor, nasıl ekleyebilirim?**
**Q: Nexus doesn't support my language. How can I add it?**

[Yeni dil talebi aç](https://github.com/probaba328/cline/issues/new?template=translation.yml). Çeviriyi kendin yapmak istersen [katkı rehberini](../CONTRIBUTING_TRANSLATION.md) takip et.

[Open a language request issue](https://github.com/probaba328/cline/issues/new?template=translation.yml), or follow the [contribution guide](../CONTRIBUTING_TRANSLATION.md) to add it yourself.

---

## Daha Fazla Yardım / More Help

- **Belgelendirme:** [docs/](./README.md)
- **GitHub Issues:** [github.com/probaba328/cline/issues](https://github.com/probaba328/cline/issues)
- **GitHub Discussions:** [github.com/probaba328/cline/discussions](https://github.com/probaba328/cline/discussions)
- **Güvenlik:** [security.md](./security.md) · security@nexus.bot
