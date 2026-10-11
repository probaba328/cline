# Güvenlik — Security

Nexus, güvenlik mimarisini sıfırdan tasarlamıştır. Bu belge, API key'lerinin nasıl saklandığını, hangi verilerin toplandığını ve hangi ağ bağlantılarının yapıldığını açıklar.

---

## API Key Güvenliği

### Saklama Mekanizması

Nexus, tüm API key'lerini ve kimlik bilgilerini **yalnızca** VS Code'un [SecretStorage API](https://code.visualstudio.com/api/references/vscode-api#SecretStorage) aracılığıyla saklar. Bu API, işletim sisteminin yerleşik kimlik bilgisi deposunu kullanır:

| İşletim Sistemi | Kimlik Bilgisi Deposu |
|-----------------|----------------------|
| macOS | Keychain |
| Windows | Credential Manager |
| Linux | libsecret (GNOME Keyring / KWallet) |

### Garantiler

| Garanti | Durum |
|---------|-------|
| Key'ler düz metin olarak diske yazılmaz | ✅ |
| Key'ler log dosyalarına eklenmez | ✅ |
| Key'ler Nexus sunucularına gönderilmez | ✅ |
| Webview arayüzü key'i maskelenmiş görür | ✅ |
| Key'ler yalnızca yapılandırılan AI endpoint'ine iletilir | ✅ |

### Teknik Detaylar

VS Code SecretStorage, Electron'un `safeStorage` API'sini kullanır. Bu API, anahtarları işletim sistemi seviyesinde şifreler. Nexus kaynak kodu, key'leri hiçbir zaman `console.log`, `outputChannel.appendLine` veya benzeri yerlere yazmaz.

Webview, key'in yalnızca ilk 4 karakterini gösterir (`sk-an****`). Tam key, extension host tarafında tutulur ve asla webview'e iletilmez.

---

## Telemetry (Kullanım Verisi)

Nexus, **yalnızca anonim, kişisel olmayan** kullanım verisi toplar. Telemetry **varsayılan olarak kapalıdır** ve istediğin zaman devre dışı bırakılabilir.

### Toplanan Veriler (Açık olduğunda)

| Kategori | Örnek Olaylar |
|----------|--------------|
| Özellik kullanımı | Görev başlatıldı, araç çağrıldı, model seçildi |
| Performans | İstek başına token sayısı, yanıt gecikmesi |
| Hatalar | Anonim hata türleri ve yığın izleri |
| Uzantı bilgisi | Nexus sürümü, VS Code sürümü |

Tüm olaylar yalnızca rastgele oluşturulan bir cihaz kimliğiyle etiketlenir. E-posta, kullanıcı adı veya hesap bilgisi içermez.

### Hiçbir Zaman Toplanmayan Veriler

- Kaynak kodu, dosya içerikleri veya dosya yolları
- Promptlar, mesajlar veya konuşma geçmişi
- API key'leri veya herhangi bir kimlik bilgisi
- Kişisel tanımlanabilir bilgiler (KTB / PII)
- IP adresi (PostHog IP anonimleştirmesi etkin)

### Telemetry Endpoint'i

Olaylar `https://data.nexus.bot` adresine gönderilir. Bu, Nexus'un kendi barındırdığı bir PostHog örneğidir. Veriler üçüncü taraflarla paylaşılmaz.

### Telemetry'yi Devre Dışı Bırakma

**VS Code Ayarları:** `telemetry.telemetryLevel` değerini `off` olarak ayarla — Nexus bu küresel ayara uyar.

**Nexus Ayarları:** Ayarlar paneli → **Gizlilik** sekmesi → Telemetry toggle'ı kapat.

Her iki ayar da değerlendirmeye alınır. VS Code küresel telemetry kapalıysa, Nexus telemetry Nexus ayarından bağımsız olarak devre dışı kalır.

---

## Ağ Bağlantıları

Nexus yalnızca şu adreslere bağlanır:

| Adres | Koşul |
|-------|-------|
| Yapılandırılan AI provider endpoint'i | Her zaman (görev çalıştığında) |
| `https://data.nexus.bot` | Yalnızca telemetry açıksa |
| `https://openrouter.ai/api/v1/models` | Yalnızca OpenRouter seçiliyse |
| Uzak yapılandırma (remote config) | İsteğe bağlı özellik, kapatılabilir |

**Nexus, kodunu hiçbir Nexus kontrollü sunucuya göndermez.** Hesap veya giriş gerektirmez.

---

## Güvenlik Mimarisi

```
┌─────────────────────────────────────────────┐
│              VS Code Extension Host         │
│                                             │
│  ┌──────────────┐    ┌───────────────────┐  │
│  │ SecretStorage│    │  Nexus Extension  │  │
│  │ (OS Keychain)│◄───│  (Node.js process)│  │
│  └──────────────┘    └────────┬──────────┘  │
│                               │             │
│                    ┌──────────▼──────────┐  │
│                    │  Webview (React UI) │  │
│                    │  [maskelenmiş key]  │  │
│                    └──────────┬──────────┘  │
└───────────────────────────────┼─────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  AI Provider Endpoint │
                    │  (Anthropic/OpenAI/…) │
                    └───────────────────────┘
```

Key, yalnızca sarı okla gösterilen yolu izler: SecretStorage → Extension Host → AI Provider. Webview, key'in tamamını hiçbir zaman görmez.

---

## Güvenlik Açıklarını Bildirme

Bir güvenlik açığı bulursan:

1. [GitHub Security Advisory](https://github.com/probaba328/cline/security/advisories/new) aracılığıyla özel olarak bildir
2. Veya **security@nexus.bot** adresine e-posta gönder

Lütfen şunları ekle:
- Sorunun kısa açıklaması
- Yeniden oluşturma adımları veya kavram kanıtı
- Sorunu gösteren log veya ekran görüntüleri

Çözüm bulunana kadar ayrıntıları herkese açık paylaşma. 72 saat içinde yanıt vermeyi hedefliyoruz.

Güvenlik araştırmacılarının sorumlu ifşaatlarını takdirle karşılıyoruz. Katkın, anonim kalmak istemiyorsan sürüm notlarında belirtilecek.

---

## Desteklenen Sürümler

Yalnızca en son minor sürüm aktif olarak yamalanır. Eski sürümler takdire bağlı düzeltmeler alır.

---

## Sonraki Adımlar

- [Başlarken →](./getting-started.md)
- [SSS →](./faq.md)
- [SECURITY.md (tam politika) →](../SECURITY.md)
