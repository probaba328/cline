# nexus-mcp-hepsiburada

Hepsiburada satıcı hesabınızı Nexus ile yönetmenizi sağlayan MCP (Model Context Protocol) sunucusu.

## Özellikler

| Araç | Açıklama |
|------|----------|
| `get_listings` | Mağazadaki ürün listelerini getirir (stok, fiyat, durum) |
| `update_inventory` | Stok miktarı ve fiyatı toplu günceller |
| `get_orders` | Siparişleri listeler (filtre: durum, tarih aralığı) |
| `update_tracking` | Pakete kargo takip numarası ekler |
| `get_cancellations` | İptal ve iade taleplerini listeler |
| `approve_cancellation` | İptal/iade talebini onaylar |
| `get_settlements` | Mutabakat/ödeme kayıtlarını listeler |

## Kurulum

### 1. Gereksinimler

- Node.js >= 18
- Hepsiburada HMS satıcı hesabı
- HMS Paneli → Entegrasyon → API Yönetimi'nden API bilgileri

### 2. Kurulum

```bash
cd nexus-mcp-hepsiburada
npm install
npm run build
```

### 3. Ortam Değişkenleri

`.env.example` dosyasını kopyalayın:

```bash
cp .env.example .env
```

```env
HB_USERNAME=api-kullaniciadi
HB_PASSWORD=api-sifresi
HB_MERCHANT_ID=satici-id
HB_BASE_URL=https://mpop.hepsiburada.com   # opsiyonel
```

## Nexus ile Kullanım

`~/.nexus/mcp-settings.json` dosyasına ekleyin:

```json
{
  "mcpServers": {
    "hepsiburada": {
      "command": "node",
      "args": ["/tam/yol/nexus-mcp-hepsiburada/dist/index.js"],
      "env": {
        "HB_USERNAME": "api-kullaniciadi",
        "HB_PASSWORD": "api-sifresi",
        "HB_MERCHANT_ID": "satici-id"
      }
    }
  }
}
```

## Teknik Detaylar

### Kimlik Doğrulama

OAuth2 Bearer Token kullanır. Sunucu ilk istekte `POST /user/api/login` ile token alır, token süresi dolduğunda otomatik yeniler. Credentials hiçbir log'a yazılmaz.

### Rate Limiting

Hepsiburada limiti: **100 istek/dakika**. İstemci tarafında kayan pencere (sliding window) ile throttle uygulanır. 429 alındığında üstel geri çekilme (exponential backoff) ile yeniden dener.

### Hata Yönetimi

- Stack trace kullanıcıya gösterilmez
- API anahtarları ve şifreler hata mesajlarına yazılmaz
- Türkçe, anlaşılır hata mesajları

### Güvenlik

| Kural | Durum |
|-------|-------|
| Credentials loglanmaz | ✅ |
| Token bellekte tutulur, diske yazılmaz | ✅ |
| Stack trace gösterilmez | ✅ |
| Her istek stateless (sunucu tarafı) | ✅ |
| HTTPS zorunlu | ✅ |

## Geliştirme

```bash
# TypeScript izleme modunda çalıştır
npm run dev

# Tip kontrolü
npm run typecheck

# Derleme
npm run build
```

## Örnek Kullanım (Nexus'ta)

```
Hepsiburada'daki tüm ürünlerimi listele
```

```
SKU HBP123'ün stokunu 50, fiyatını 299.90 TL olarak güncelle
```

```
Son 7 günün iptal taleplerini göster
```
