# Başlarken — Getting Started

> **Nexus**, VS Code içinde çalışan yapay zeka destekli bir kodlama asistanıdır. Dosyalarını okur, yazar, terminal komutları çalıştırır ve değişiklikleri her adımda senin onayınla gerçekleştirir.

---

## 1. Kurulum

### VS Code Marketplace (Önerilen)

1. VS Code'u aç
2. Uzantılar panelini aç: `Ctrl+Shift+X` (macOS: `⌘+Shift+X`)
3. Arama kutusuna **Nexus** yaz
4. **Nexus** uzantısını bul → **Install** düğmesine tıkla
5. VS Code yeniden yüklendiğinde sol panelde Nexus simgesi belirecek

### Kaynaktan Derleme

```bash
git clone https://github.com/probaba328/cline.git
cd cline
bun install

cd apps/vscode
bun run build:webview   # React arayüzünü derler (~15 sn)
bun esbuild.mjs         # Uzantıyı paketler
```

Geliştirme sunucusunu başlat:

```bash
DISPLAY=:1 code --no-sandbox \
  --user-data-dir=/tmp/vscode-userdata \
  --extensionDevelopmentPath=$(pwd)/apps/vscode \
  .
```

### Sistem Gereksinimleri

| Gereksinim | Minimum Sürüm |
|-----------|---------------|
| VS Code | 1.101.0 |
| İşletim sistemi | Windows 10 · macOS 12 · Ubuntu 20.04 |

---

## 2. İlk Kurulum (Onboarding)

Nexus'u ilk açtığında **6 adımlı kurulum sihirbazı** karşılar:

| Adım | Ne Yapılır |
|------|-----------|
| 1. Hoş Geldin | Nexus tanıtımı |
| 2. Dil | Arayüz dilini seç (cihaz dili önerilir) |
| 3. Gizlilik | Telemetry tercihini belirle |
| 4. AI Modeli | Provider seç (Anthropic, OpenAI, Ollama...) |
| 5. API Key | Seçilen provider'ın anahtarını gir |
| 6. Hazır | Nexus kullanıma hazır |

Her adım **atlanabilir** — kurulum sihirbazını tamamen geçmek için "Tümünü Atla" düğmesini kullan.

Kurulumu sonradan değiştirmek için: Ayarlar → **AI Modeli** sekmesi.

---

## 3. API Key Nasıl Alınır

### Anthropic (Claude)

En güçlü modeller — karmaşık görevler, kod mimarlığı, uzun bağlam.

1. [console.anthropic.com](https://console.anthropic.com) adresine git
2. Hesap oluştur veya giriş yap
3. **API Keys** → **Create Key** → bir isim ver (örn. "Nexus")
4. Anahtarı **hemen kopyala** — bir daha göremezsin
5. Nexus Ayarlar → AI Modeli → Provider: **Anthropic** → anahtarı yapıştır

**Key formatı:** `sk-ant-api03-...`
**Fiyatlandırma:** [anthropic.com/pricing](https://www.anthropic.com/pricing)

---

### OpenAI (GPT-4o, o3)

Hızlı görevler, araç kullanımı, geniş ekosistem.

1. [platform.openai.com](https://platform.openai.com) adresine git
2. **API keys** → **Create new secret key**
3. Anahtarı kopyala — bir daha göremezsin
4. Nexus Ayarlar → AI Modeli → Provider: **OpenAI** → anahtarı yapıştır

**Key formatı:** `sk-proj-...`
**Fiyatlandırma:** [openai.com/pricing](https://openai.com/pricing)

---

### OpenRouter (200+ Model)

Tek key ile yüzlerce modele erişim — deneme ve karşılaştırma için ideal.

1. [openrouter.ai](https://openrouter.ai) → Google veya GitHub ile giriş yap
2. **Keys** sayfasına git → anahtarı kopyala
3. Nexus Ayarlar → AI Modeli → Provider: **OpenRouter** → anahtarı yapıştır

**Key formatı:** `sk-or-v1-...`
**Not:** Bazı modeller OpenRouter üzerinden ücretsizdir.

---

### Google Gemini

1. [aistudio.google.com](https://aistudio.google.com) adresine git
2. **Get API key** → **Create API key**
3. Nexus Ayarlar → AI Modeli → Provider: **Google Gemini** → anahtarı yapıştır

**Key formatı:** `AIza...`

---

### Ollama (Ücretsiz · Çevrimdışı · Yerel)

İnternet gerekmez. Tüm işlemler kendi bilgisayarında çalışır.

1. [ollama.com](https://ollama.com) adresinden Ollama'yı indir ve kur
2. Terminal'de bir model indir:
   ```bash
   ollama pull qwen2.5-coder   # Kodlama için önerilen
   ollama pull llama3.2        # Genel amaçlı
   ```
3. Nexus Ayarlar → AI Modeli → Provider: **Ollama**
4. API key gerekmez — Nexus otomatik bağlanır

**Not:** Ollama seçildiğinde Nexus arayüzünde "Offline mode active" göstergesi belirir.

---

### LM Studio (Ücretsiz · Çevrimdışı · GUI)

Grafik arayüzle yerel model çalıştırma.

1. [lmstudio.ai](https://lmstudio.ai) adresinden indir
2. Bir model yükle ve **Local Server**'ı başlat (varsayılan port: 1234)
3. Nexus Ayarlar → AI Modeli → Provider: **LM Studio**

---

## 4. İlk Görev

Nexus panelinde metin kutusuna bir görev yaz ve `Enter`'a bas:

```
src/utils/date.ts dosyasındaki formatDate fonksiyonunu refactor et,
ISO 8601 formatını da desteklesin
```

Nexus her değişiklik öncesinde onayını isteyecek. **"Approve"** ile devam et ya da **"Reject"** ile durdur.

---

## 5. Klavye Kısayolları

| Eylem | Windows/Linux | macOS |
|-------|--------------|-------|
| Nexus panelini aç | `Ctrl+Shift+P` → "Nexus: Open" | `⌘+Shift+P` → "Nexus: Open" |
| Görevi iptal et | `Esc` | `Esc` |
| Ayarları aç | Nexus paneli → ⚙️ simgesi | — |

---

## Sonraki Adımlar

- [Desteklenen Modeller →](./models.md)
- [Güvenlik ve API Key Saklama →](./security.md)
- [SSS →](./faq.md)
