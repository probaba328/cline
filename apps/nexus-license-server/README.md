# nexus-license-server

Nexus MCP lisans doğrulama sunucusu. Lemon Squeezy abonelik entegrasyonu ile
MCP server'lar için lisans kontrolü sağlar.

## Mimari

```
MCP Server
    │  POST /v1/validate { license_key, product }
    ▼
nexus-license-server
    │  POST https://api.lemonsqueezy.com/v1/licenses/validate
    ▼
Lemon Squeezy API
```

Webhook:
```
Lemon Squeezy
    │  POST /v1/webhook (imzalı)
    ▼
nexus-license-server → SQLite DB güncelle
```

## Kurulum

```bash
npm install
cp .env.example .env
# .env dosyasını düzenle
npm run build
node dist/index.js
```

## Ortam Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `LEMONSQUEEZY_API_KEY` | LS API key (Settings → API) |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Webhook imzalama anahtarı |
| `DATABASE_URL` | SQLite dosya yolu (varsayılan: `./data/licenses.db`) |
| `PORT` | HTTP port (varsayılan: 3000) |
| `LS_VARIANT_TRENDYOL` | Trendyol ürün variant ID |
| `LS_VARIANT_HEPSIBURADA` | Hepsiburada ürün variant ID |
| `LS_VARIANT_GITHUB_PRO` | GitHub Pro ürün variant ID |
| `LS_VARIANT_BUNDLE` | Tüm Paket variant ID |

## API

### POST /v1/validate

```json
// İstek
{ "license_key": "XXXX-XXXX-XXXX-XXXX", "product": "trendyol" }

// Yanıt (geçerli)
{ "valid": true, "product": "trendyol", "expires_at": "2025-02-01T00:00:00Z" }

// Yanıt (geçersiz)
{ "valid": false, "error": "Lisans anahtarı geçersiz veya etkin değil." }
```

**Cache:** Son Lemon Squeezy kontrolünden bu yana 24 saat geçmediyse DB'den yanıt verilir.

### POST /v1/webhook

Lemon Squeezy webhook endpoint'i. `X-Signature` header'ı ile HMAC-SHA256 doğrulaması yapılır.

İşlenen olaylar:
- `license_key_created` → DB'ye kaydet
- `license_key_updated` → Durumu güncelle
- `subscription_cancelled` → Cancelled olarak işaretle
- `subscription_expired` → Expired olarak işaretle
- `subscription_payment_success` / `subscription_resumed` → Active yap + expires_at güncelle

### GET /health

```json
{ "status": "ok", "version": "1.0.0" }
```

## Güvenlik

| Kural | Durum |
|-------|-------|
| Lisans anahtarı SHA-256 hash'i saklanır | ✅ |
| Ham anahtar asla yazılmaz | ✅ |
| Webhook imzası HMAC-SHA256 ile doğrulanır | ✅ |
| Stack trace gösterilmez | ✅ |
| LS API key loglanmaz | ✅ |

## Lemon Squeezy Kurulumu

1. [app.lemonsqueezy.com](https://app.lemonsqueezy.com) → Products → Yeni ürün oluştur
2. Her ürün için: Variants → License keys aktif et
3. Settings → Webhooks → Add → URL + Events + Secret
4. Settings → API → Key oluştur

Variant ID'leri: Products → ürün → Variants sekmesindeki ID değerleri
