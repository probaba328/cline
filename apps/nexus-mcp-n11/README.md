# nexus-mcp-n11

N11 satıcı hesabınızı Nexus ile yönetmenizi sağlayan MCP (Model Context Protocol) sunucusu.

## Araçlar

| Araç | Açıklama |
|------|----------|
| `get_products` | Ürünleri listeler (sayfalama, durum filtresi) |
| `update_stock` | Stok miktarını günceller |
| `update_price` | Fiyat günceller (isteğe bağlı indirim desteği) |
| `get_orders` | Siparişleri listeler (tarih, durum filtresi) |
| `update_order_status` | Sipariş durumunu günceller (kargo takip desteği) |
| `get_questions` | Müşteri sorularını listeler |
| `answer_question` | Müşteri sorusunu yanıtlar |

## Kurulum

### 1. API Bilgilerini Al

**n11.com → Mağazam → API Bilgileri** sayfasından API Key ve API Secret'i alın.

### 2. Kur ve Derle

```bash
cd nexus-mcp-n11
npm install
npm run build
```

### 3. Ortam Değişkenleri

```bash
cp .env.example .env
```

```env
N11_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
N11_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXUS_LICENSE_KEY=XXXX-XXXX-XXXX-XXXX
```

## Nexus ile Kullanım

`~/.nexus/mcp-settings.json`:

```json
{
  "mcpServers": {
    "n11": {
      "command": "node",
      "args": ["/tam/yol/nexus-mcp-n11/dist/index.js"],
      "env": {
        "N11_API_KEY": "...",
        "N11_API_SECRET": "...",
        "NEXUS_LICENSE_KEY": "XXXX-XXXX-XXXX-XXXX"
      }
    }
  }
}
```

## Teknik Detaylar

### Kimlik Doğrulama

Her API isteğinde `auth: { appKey, appSecret }` gönderilir. Credentials hiçbir log'a yazılmaz.

### Rate Limiting

5 istek/saniye istemci tarafı throttle. N11 500 döndürdüğünde üstel backoff uygulanır.

### Hata Yönetimi

| Durum | Mesaj |
|-------|-------|
| 401 / 403 | "API bilgilerin hatalı." |
| 429 | "Rate limit aşıldı." |
| 500+ | "N11 servisi yanıt vermiyor." |
| N11 `result.status=failure` | N11 hata kodu → Türkçe mesaj |

### N11 API Notu

N11 API'si SOAP/REST hibrit yapıdadır. Bu sunucu REST JSON endpoint'lerini kullanır.
N11 bazı durumlarda HTTP 200 ile hata döndürebilir — bu durumlar `result.status` alanından yakalanır.

## Örnek Kullanım

```
N11 mağazamdaki aktif ürünleri göster
```

```
Ürün ID 123456'nın stokunu 50 yap
```

```
Bugünden itibaren son 7 günün siparişlerini listele
```

```
Yanıtsız soruları göster
```
