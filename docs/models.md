# Desteklenen Modeller

Nexus, API key gerektiren bulut modelleri ve kendi bilgisayarında çalışan yerel modelleri destekler. Hiçbir provider'a bağımlı değilsin.

---

## Hızlı Seçim Rehberi

| İhtiyaç | Önerilen Model | Provider |
|---------|---------------|---------|
| Karmaşık mimari, uzun bağlam | Claude Sonnet 4.5 / Opus | Anthropic |
| Hızlı düzeltmeler, refactoring | Claude Haiku 3.5 | Anthropic |
| Araç kullanımı yoğun görevler | GPT-4o | OpenAI |
| Ücretsiz, güçlü, hızlı | Gemini 2.0 Flash | Google |
| Çevrimdışı, ücretsiz | Qwen2.5-Coder, Codestral | Ollama |
| 200+ model tek yerden | Herhangi bir model | OpenRouter |

---

## Anthropic — Claude

**Ne zaman kullan:** Uzun bağlamlı refactoring, mimari tasarım, karmaşık hata ayıklama.

| Model | Bağlam | Güç | Hız | Maliyet |
|-------|--------|-----|-----|---------|
| `claude-opus-4-5` | 200K token | ⭐⭐⭐⭐⭐ | Yavaş | $$$$$ |
| `claude-sonnet-4-5` | 200K token | ⭐⭐⭐⭐ | Orta | $$$ |
| `claude-haiku-3-5` | 200K token | ⭐⭐⭐ | Hızlı | $ |

**Extended Thinking:** Claude 3.7+ modeller düşünce sürecini göstererek daha derin analiz yapar. Nexus ayarlarından etkinleştirilebilir.

**API Key Alma:** [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

---

## OpenAI — GPT, o-Serisi

**Ne zaman kullan:** Araç çağrıları, JSON çıktıları, geniş bağlam penceresi gereken görevler.

| Model | Bağlam | Özellik |
|-------|--------|---------|
| `gpt-4o` | 128K token | Çok modlu, hızlı |
| `gpt-4o-mini` | 128K token | Ucuz, günlük görevler |
| `o3-mini` | 200K token | Derin akıl yürütme |
| `o1` | 200K token | En güçlü akıl yürütme |

**API Key Alma:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

---

## Google Gemini

**Ne zaman kullan:** Ücretsiz veya düşük maliyetli seçenek, büyük bağlam.

| Model | Bağlam | Özellik |
|-------|--------|---------|
| `gemini-2.0-flash` | 1M token | Hızlı, ücretsiz katman mevcut |
| `gemini-2.5-pro` | 2M token | En büyük bağlam penceresi |
| `gemini-2.5-flash` | 1M token | Fiyat/performans dengesi |

**Not:** Gemini 2.0 Flash, Google AI Studio üzerinden **ücretsiz** kullanılabilir (dakikada 15 istek sınırı).

**API Key Alma:** [aistudio.google.com](https://aistudio.google.com)

---

## OpenRouter — 200+ Model

**Ne zaman kullan:** Farklı modelleri denemek, tek key ile çoklu provider erişimi.

OpenRouter, Anthropic, OpenAI, Google, Meta, Mistral ve daha fazlasının modellerini tek API ile sunar.

**Ücretsiz modeller (2026 itibarıyla mevcut):**

| Model | Sağlayıcı | Sınır |
|-------|----------|-------|
| `google/gemini-2.0-flash-exp:free` | Google | Günde 1500 istek |
| `meta-llama/llama-3.3-70b-instruct:free` | Meta | Günde 200 istek |
| `mistralai/mistral-7b-instruct:free` | Mistral | Günde 200 istek |

**Not:** `:free` eki olan modeller ücretsizdir; diğerleri ücretlidir.

**API Key Alma:** [openrouter.ai/keys](https://openrouter.ai/keys)

---

## AWS Bedrock

**Ne zaman kullan:** Kurumsal güvenlik gereksinimleri, VPC içi çalışma, AWS altyapısı.

Desteklenen modeller: Claude 3.5/3.7 Sonnet, Llama 3.3, Mistral Large.

**Kimlik bilgisi kurulumu:**
```bash
aws configure
# AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION
```

Nexus Ayarlar → AI Modeli → Provider: **AWS Bedrock** → region ve model seç.

---

## Azure OpenAI

**Ne zaman kullan:** Microsoft ekosistemi, kurumsal veri uyumluluğu.

Nexus Ayarlar → AI Modeli → Provider: **Azure OpenAI** → endpoint URL ve key gir.

---

## Ollama — Ücretsiz & Çevrimdışı

**Ne zaman kullan:** İnternet yokken, gizlilik önceliği, ücretsiz kullanım.

Tüm inference kendi bilgisayarında çalışır. Hiçbir veri dışarı çıkmaz.

### Kurulum

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows: ollama.com/download adresinden indir
```

### Önerilen Kodlama Modelleri

| Model | Boyut | Özellik |
|-------|-------|---------|
| `qwen2.5-coder:7b` | ~4 GB | Kod üretimi için optimize |
| `qwen2.5-coder:14b` | ~8 GB | Daha güçlü, ekstra RAM gerekli |
| `deepseek-coder-v2` | ~8 GB | Matematik + kod |
| `codestral` | ~12 GB | Mistral'ın kodlama modeli |
| `llama3.2:3b` | ~2 GB | Hızlı, düşük kaynak |

```bash
# Model indirme
ollama pull qwen2.5-coder:7b

# Çalışıp çalışmadığını test et
ollama run qwen2.5-coder:7b "merhaba"

# Yüklü modelleri listele
ollama list
```

### RAM Gereksinimleri

| Model Boyutu | Minimum RAM |
|-------------|-------------|
| 3B parametre | 4 GB |
| 7B parametre | 8 GB |
| 13B parametre | 16 GB |
| 30B parametre | 32 GB |

**GPU Desteği:** NVIDIA (CUDA), AMD (ROCm), Apple Silicon (Metal) desteklenir. GPU yoksa CPU ile çalışır — daha yavaş ama işlevsel.

---

## LM Studio — GUI ile Yerel Model

**Ne zaman kullan:** Grafik arayüzle model yönetimi, Ollama'ya alternatif.

1. [lmstudio.ai](https://lmstudio.ai) adresinden indir
2. Model ara ve indir (GGUF formatı)
3. **Local Server** → **Start Server** (varsayılan: `http://localhost:1234`)
4. Nexus Ayarlar → AI Modeli → Provider: **LM Studio**

---

## Model Seçim İpuçları

### Bağlam Penceresi Önemlidir

Büyük bir codebase ile çalışıyorsan, **daha büyük bağlam** = daha doğru sonuç:

```
Küçük proje (< 50 dosya)  → Haiku / Flash / Llama
Orta proje (50–500 dosya) → Sonnet / GPT-4o
Büyük proje (500+ dosya)  → Opus / Gemini 2.5 Pro
```

### Hız vs Güç

```
Hızlı düzeltme, yorum ekleme  → Haiku · Flash · GPT-4o-mini
Refactoring, yeni özellik      → Sonnet · GPT-4o
Mimari karar, tasarım analizi  → Opus · o1 · Gemini 2.5 Pro
```

### Maliyet Kontrolü

- **Ücretsiz başlamak için:** Google Gemini 2.0 Flash (AI Studio üzerinden)
- **Yerel + ücretsiz:** Ollama + Qwen2.5-Coder
- **Fiyat/performans:** Claude Haiku 3.5 veya GPT-4o-mini
- **Bütçe yok:** OpenRouter üzerindeki ücretsiz modeller

---

## Sonraki Adımlar

- [Başlarken — API key kurulumu →](./getting-started.md)
- [Güvenlik →](./security.md)
- [SSS →](./faq.md)
