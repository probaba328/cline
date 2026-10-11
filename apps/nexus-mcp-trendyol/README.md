# nexus-mcp-trendyol

Trendyol satıcı hesabınızı Nexus ile yönetmek için MCP (Model Context Protocol) server.

Ürünlerinizi listeleyin, stok ve fiyat güncelleyin, siparişleri takip edin, müşteri sorularını yanıtlayın — hepsini doğal dilde.

---

## Kurulum

### 1. Trendyol API Bilgilerini Alın

1. [Trendyol Satıcı Paneli](https://partner.trendyol.com)'ne giriş yapın
2. **Hesap Bilgilerim** → **Entegrasyon Bilgileri** bölümüne gidin
3. Aşağıdaki bilgileri not alın:
   - **Supplier ID** (Mağaza ID)
   - **API Key**
   - **API Secret**

### 2. Nexus'a Ekleyin

Nexus'ta **Ayarlar → MCP Servers** sayfasına gidin ve yeni server ekle:

```json
{
  "nexus-mcp-trendyol": {
    "command": "npx",
    "args": ["-y", "nexus-mcp-trendyol"],
    "env": {
      "TRENDYOL_SUPPLIER_ID": "12345",
      "TRENDYOL_API_KEY": "your-api-key",
      "TRENDYOL_API_SECRET": "your-api-secret"
    }
  }
}
```

### 3. Yerel Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env
# .env dosyasını düzenleyip Trendyol bilgilerini gir

# Geliştirme modunda çalıştır
npm run dev

# Derle
npm run build
```

---

## Desteklenen Araçlar

| Araç | Açıklama |
|------|----------|
| `get_products` | Ürünleri listele (sayfalama, durum filtresi) |
| `update_stock` | Ürün stoğunu güncelle |
| `update_price` | Satış ve liste fiyatını güncelle |
| `get_orders` | Siparişleri listele (tarih, durum filtresi) |
| `update_order_status` | Sipariş durumunu güncelle |
| `get_questions` | Bekleyen müşteri sorularını getir |
| `answer_question` | Müşteri sorusunu yanıtla |
| `get_claims` | İade taleplerini listele |
| `get_settlements` | Hakediş raporlarını getir |

---

## Örnek Kullanım

### Ürün Listesi
```
Mağazamdaki satıştaki ürünleri listele
```
→ `get_products` çağrılır, approved ürünler listelenir.

### Stok Güncelleme
```
1234567890123 barkodlu ürünün stokunu 50 yap
```
→ `update_stock` çağrılır.

### Sipariş Takibi
```
Bu haftaki siparişleri getir
```
→ `get_orders` çağrılır, bu haftanın tarih aralığıyla.

### Müşteri Sorusu Yanıtlama
```
Bekleyen soruları göster ve ilk soruyu yanıtla
```
→ `get_questions` → `answer_question` sırasıyla çağrılır.

### Hakediş Özeti
```
Ocak 2024 hakedişlerimi getir ve toplam kazancımı söyle
```
→ `get_settlements` çağrılır, net kazanç hesaplanır.

---

## Rate Limiting

Trendyol API'si **10 istek/saniye** ile sınırlıdır.

Bu server otomatik olarak:
- **Client-side throttling** ile 10 req/s limitini aşmamaya çalışır
- **429 Too Many Requests** durumunda exponential backoff uygular (500ms → 1s → 2s → 4s)
- **500 Server Error** durumunda 2 kez daha dener

---

## Hata Mesajları

| Durum | Mesaj |
|-------|-------|
| `401 Unauthorized` | "API bilgilerin hatalı. Trendyol panelinden kontrol et." |
| `429 Too Many Requests` | "Rate limit aşıldı. Otomatik bekleniyor..." |
| `5xx Server Error` | "Trendyol servisi şu an yanıt vermiyor. Tekrar dene." |

---

## Güvenlik

- API Key ve Secret **hiçbir log'a yazılmaz**
- Credentials yalnızca `Authorization: Basic base64(key:secret)` header'ında kullanılır
- Hata mesajları API key içermez
- Stack trace kullanıcıya gösterilmez

---

## Teknik Detaylar

- **Base URL**: `https://api.trendyol.com/sapigw/suppliers/{supplierId}/`
- **Auth**: HTTP Basic Authentication
- **Protokol**: MCP (Model Context Protocol) — stdio transport
- **Runtime**: Node.js >= 18
- **Dil**: TypeScript

---

## Lisans

MIT
