# BYOK — Bring Your Own Key

Nexus, kendi API key'lerinizi kullanarak desteklenen tüm sağlayıcılara bağlanmanıza olanak tanır. Key'ler hiçbir zaman Nexus sunucularına gönderilmez; yalnızca seçtiğiniz sağlayıcının endpoint'ine iletilir.

---

## Desteklenen Sağlayıcılar

| Sağlayıcı | Key Formatı | Endpoint |
|-----------|-------------|----------|
| Anthropic | `sk-ant-...` | api.anthropic.com |
| OpenAI | `sk-...` | api.openai.com |
| Google Gemini | `AIza...` | generativelanguage.googleapis.com |
| Groq | `gsk_...` | api.groq.com |
| OpenRouter | `sk-or-v1-...` | openrouter.ai |
| Ollama | (key gerekmez) | localhost:11434 |
| LM Studio | (key gerekmez) | localhost:1234 |
| OpenAI-Compatible | Opsiyonel | Özel URL |

---

## Kurulum (5 Adım)

### 1. Sağlayıcı Seç

**Ayarlar → API Keys → Ekle** yolunu izleyin.  
Sekiz sağlayıcıdan birini tıklayın. Yanında yeşil "Aktif" etiketi olan sağlayıcıların zaten kaydedilmiş key'i vardır.

### 2. API Key Gir

Her sağlayıcı kendi key formatını kabul eder:

```
Anthropic  : sk-ant-api03-...
OpenAI     : sk-proj-...
Google     : AIzaSy...
Groq       : gsk_...
OpenRouter : sk-or-v1-...
Ollama     : (boş bırakın)
LM Studio  : (boş bırakın)
```

Key hiçbir log'a yazılmaz. Ekranda daima maskelenmiş hâliyle gösterilir (`sk-ant-...xxxx`).

### 3. Doğrula

İki aşamalı doğrulama yapılır:

1. **Format kontrolü** — Key'in beklenen regex ile eşleşip eşleşmediği kontrol edilir.
2. **Bağlantı testi** — Sağlayıcının API'sine kısa bir test isteği atılır (örn. `/v1/models`).

Yerel sağlayıcılar (Ollama, LM Studio) için yalnızca endpoint erişilebilirliği test edilir.

### 4. Model Seç

Sağlayıcı için varsayılan modeli seçin. Önerilen model işaretlenmiştir.

### 5. Kaydet

Key **cihazınızda** `~/.nexus/data/byok-secrets.json` dosyasına `0o600` izniyle şifreli olarak saklanır.

---

## Key Yönetimi

**Ayarlar → API Keys** sayfasından:

- **Listeleme** — Kayıtlı tüm sağlayıcılar ve maskelenmiş key'leri.
- **Test** — Mevcut key'i anlık doğrulama (sağlayıcıya test isteği atar).
- **Silme** — Key ve tüm metadata'sı kalıcı olarak silinir.
- **Yeni ekleme** — Sihirbaz yeniden başlatılır.

---

## Güvenlik

| Kural | Detay |
|-------|-------|
| **Hiçbir yerde loglanmaz** | API key'ler VS Code output panel'inde, konsol loglarında veya hata mesajlarında görünmez. |
| **Hiçbir sunucuya gönderilmez** | Key, yalnızca seçtiğiniz sağlayıcının endpoint'ine doğrudan gönderilir. |
| **Şifreli saklanır** | `byok-secrets.json` dosyası `0o600` (owner read/write only) izniyle oluşturulur. |
| **Ekranda tam gösterilmez** | Her zaman `sk-ant-...xxxx` formatında maskelenir. |
| **Stateless** | Her istek bağımsızdır; key bellekte tutulmaz. |
| **Stack trace yok** | Hata mesajları kullanıcı dostu; teknik detay veya key bilgisi içermez. |

---

## Hata Kodları

| Kod | Anlam | Çözüm |
|-----|-------|-------|
| `invalid_key` | Key geçersiz veya yetkisiz | Key'i sağlayıcı konsolundan kontrol edin |
| `rate_limit` | İstek limiti aşıldı | Birkaç saniye bekleyin |
| `insufficient_credits` | Yetersiz kredi | Sağlayıcı hesabınıza kredi yükleyin |
| `network_error` | Bağlantı hatası | İnternet bağlantınızı veya endpoint URL'sini kontrol edin |
| `model_not_found` | Model bulunamadı | Model ID'sini kontrol edin |
| `unknown` | Bilinmeyen hata | Sağlayıcı konsolunuzu kontrol edin |

---

## Teknik Mimari

```
Webview (BYOKKeyManager / BYOKSetupWizard)
    ↕ gRPC (ByokServiceClient)
Extension Host (ByokService handlers)
    ↕ BYOKService
~/.nexus/data/byok-secrets.json (0o600)
```

**Sağlayıcı katalogları** → `apps/vscode/src/shared/byok/catalog.ts`  
**Key depolama** → `apps/vscode/src/services/byok/BYOKService.ts`  
**Key doğrulama** → `apps/vscode/src/services/byok/BYOKValidationService.ts`  
**gRPC handlers** → `apps/vscode/src/core/controller/byok/`  
**Proto tanımı** → `apps/vscode/proto/nexus/byok.proto`  
**Webview bileşenleri** → `apps/vscode/webview-ui/src/components/settings/byok/`
