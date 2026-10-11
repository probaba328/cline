# Nexus MCP Lisans Sistemi

Nexus MCP server'ları Lemon Squeezy üzerinden lisanslanır.
Her server ayrı satın alınabilir; tüm pakette indirim vardır.

---

## Ürün ve Fiyatlar

| Ürün | Fiyat/Ay | Lemon Squeezy |
|------|----------|---------------|
| Nexus MCP - Trendyol | $9.99 | [Satın Al →](https://nexus.dev/marketplace/trendyol) |
| Nexus MCP - Hepsiburada | $9.99 | [Satın Al →](https://nexus.dev/marketplace/hepsiburada) |
| Nexus MCP - GitHub Pro | $4.99 | [Satın Al →](https://nexus.dev/marketplace/github-pro) |
| Nexus MCP - Analytics | $7.99 | [Satın Al →](https://nexus.dev/marketplace/analytics) |
| **Tüm Paket** | **$24.99** | [Satın Al →](https://nexus.dev/marketplace/bundle) |

Tüm planlar aylık aboneliktir. İstediğiniz zaman iptal edebilirsiniz.

---

## 1. Lisans Satın Alma

1. [nexus.dev/marketplace](https://nexus.dev/marketplace) adresine gidin
2. İstediğiniz ürünü seçin
3. "Satın Al" butonuna tıklayın → Lemon Squeezy ödeme sayfası açılır
4. Ödemeyi tamamlayın (kredi kartı veya PayPal)
5. **Otomatik e-posta gelir** — lisans anahtarınız bu e-postadadır

---

## 2. Lisans Anahtarını Bulma

Satın alma sonrası:
- **E-posta**: Kayıtlı adresinize gelen "Your License Key" e-postasını açın
- **Dashboard**: [app.lemonsqueezy.com/my-orders](https://app.lemonsqueezy.com/my-orders) → sipariş detayı → License Keys
- **Nexus Dashboard**: [nexus.dev/dashboard](https://nexus.dev/dashboard) → My Licenses

Lisans anahtarı formatı:
```
XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

---

## 3. Lisansı Aktive Etme

MCP server'ı başlatmadan önce `NEXUS_LICENSE_KEY` ortam değişkenini ayarlayın:

```bash
export NEXUS_LICENSE_KEY=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

Veya MCP settings dosyanıza ekleyin (`~/.nexus/mcp-settings.json`):

```json
{
  "mcpServers": {
    "trendyol": {
      "command": "node",
      "args": ["/path/to/nexus-mcp-trendyol/dist/index.js"],
      "env": {
        "NEXUS_LICENSE_KEY": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
        "TRENDYOL_SUPPLIER_ID": "...",
        "TRENDYOL_API_KEY": "...",
        "TRENDYOL_API_SECRET": "..."
      }
    }
  }
}
```

MCP server ilk başlatıldığında lisans doğrulanır. Başarılıysa çalışmaya devam eder.

---

## 4. Lisans Doğrulama Nasıl Çalışır?

```
MCP Server başlar
       │
       ▼
NEXUS_LICENSE_KEY var mı?
  │ Hayır → Hata mesajı + exit(1)
  │ Evet  ↓
       ▼
Yerel cache < 24 saat?
  │ Evet → cache'den dön (hızlı)
  │ Hayır ↓
       ▼
nexus-license-server /v1/validate
       │
       ▼
Lemon Squeezy API doğrulama
       │
       ├─ Aktif → ✅ MCP server çalışır
       └─ İptal/Süresi dolmuş → ❌ Hata + exit(1)
```

**24 saatlik cache**: Gereksiz ağ isteği atmamak için doğrulama sonucu yerel bellekte tutulur.
Server yeniden başlatılırsa kontrol tekrarlanır.

**Çevrimdışı grace period**: Lisans sunucusuna ulaşılamazsa son başarılı doğrulama sonucu kullanılır (graceful degradation).

---

## 5. Lisans İptal Etme

### Aboneliği Durdurmak
1. [app.lemonsqueezy.com/my-subscriptions](https://app.lemonsqueezy.com/my-subscriptions) adresine gidin
2. İlgili aboneliği seçin → "Cancel subscription"
3. Onaylayın

İptal sonrası mevcut dönem sonuna kadar lisans aktif kalır.
Dönem sonunda MCP server otomatik devre dışı olur.

### Aboneliği Yeniden Aktifleştirmek
Aynı sayfadan "Resume subscription" ile yeniden aktifleştirilebilir.
Lisans anahtarı değişmez.

---

## 6. Sorun Giderme

### "Lisans anahtarı bulunamadı"
`NEXUS_LICENSE_KEY` ortam değişkenini ayarlamayı unutmuşsunuz.

### "Lisansınız geçersiz veya süresi dolmuş"
- Abonelik iptal edilmiş veya ödeme başarısız olmuş olabilir
- [nexus.dev/dashboard](https://nexus.dev/dashboard) adresinden durumu kontrol edin
- Yeni abonelik başlatın → aynı lisans anahtarını kullanın

### "Bu lisans anahtarı 'X' ürünü için geçerli değil"
Farklı bir ürün için satın alınmış lisans anahtarı kullanıyorsunuz.
Tüm ürünlere erişmek için **Tüm Paket** satın alın.

### "Lisans sunucusuna ulaşılamıyor"
Ağ bağlantınızı kontrol edin. Sunucu geçici olarak erişilemiyorsa
önceki doğrulama sonucu kullanılmaya devam eder.

---

## 7. Lisans Sunucusu (Self-Hosted)

Kendi altyapınızda çalıştırmak isterseniz `nexus-license-server/` projesini kullanabilirsiniz:

```bash
cd nexus-license-server
cp .env.example .env
# .env dosyasını düzenleyin
npm install && npm run build
node dist/index.js
```

Ardından MCP server'larda şunu ayarlayın:
```bash
NEXUS_LICENSE_SERVER=http://localhost:3000
```

### Lemon Squeezy Webhook Ayarı

1. [app.lemonsqueezy.com](https://app.lemonsqueezy.com) → Settings → Webhooks → Add webhook
2. URL: `https://your-server.com/v1/webhook`
3. Events: `license_key_created`, `license_key_updated`, `subscription_cancelled`, `subscription_expired`, `subscription_payment_success`
4. Secret key oluşturun → `.env` dosyasına `LEMONSQUEEZY_WEBHOOK_SECRET` olarak ekleyin

---

## Gizlilik ve Güvenlik

- Lisans anahtarı SHA-256 hash'i veritabanında saklanır; ham anahtar asla yazılmaz
- API anahtarları ve şifreler log'lara yazılmaz
- Stack trace kullanıcıya gösterilmez
- Tüm bağlantılar HTTPS üzerinden yapılır
