# Katkıda Bulunma — Contributing

Nexus açık kaynaklı bir projedir. Hata düzeltmeleri, yeni özellikler, çeviriler ve belgelendirme — her türlü katkı memnuniyetle karşılanır.

---

## Başlamadan Önce

1. Benzer bir sorun/PR'ın zaten açık olmadığını kontrol et: [Issues](https://github.com/probaba328/cline/issues) · [Pull Requests](https://github.com/probaba328/cline/pulls)
2. Büyük değişiklikler için önce bir issue açıp tartış — gereksiz iş yapmamak için
3. Repo'yu fork et ve özel bir branch oluştur

```bash
git clone https://github.com/KULLANICIN/cline.git
cd cline
git checkout -b feat/ozellik-adiniz
```

---

## Geliştirme Ortamı Kurulumu

### Gereksinimler

| Araç | Minimum Sürüm |
|------|--------------|
| Bun | 1.3.13 |
| Node.js | 22 |
| VS Code | 1.101.0 |

**Önemli:** npm, yarn veya pnpm kullanma. Tüm komutlar `bun` ile çalıştırılmalıdır.

### İlk Kurulum

```bash
# Tüm bağımlılıkları yükle
bun install

# SDK paketlerini derle (ilk kurulumda ve SDK değişikliklerinde zorunlu)
bun run build:sdk

# VS Code uzantısını derle
cd apps/vscode
bun run build:webview   # React arayüzü (~15 sn)
bun esbuild.mjs         # Extension bundle

# Geliştirme modunda çalıştır
DISPLAY=:1 code --no-sandbox \
  --user-data-dir=/tmp/vscode-userdata \
  --extensionDevelopmentPath=$(pwd) \
  .
```

### SDK'yı Ne Zaman Yeniden Derlemek Gerekir

`sdk/packages/` altında bir şey değiştirdiysen, CLI veya VS Code uzantısını çalıştırmadan önce mutlaka:

```bash
bun run build:sdk
```

Çalışan process'ler SDK kaynak değişikliklerini otomatik yüklemez — yeniden derleme ve yeniden başlatma gerekir.

---

## Kod Katkısı

### Kalite Kontrolleri

PR açmadan önce şu komutların temiz geçtiğinden emin ol:

```bash
cd apps/vscode

# TypeScript tip kontrolü + lint + format (paralel)
bun run ci:check-all

# Birim testleri
bun run test:unit

# Vitest (SDK + model kataloğu)
bun run test:vitest
```

### Commit Mesajı Formatı

[Conventional Commits](https://www.conventionalcommits.org) standardını kullan:

```
<tür>(<kapsam>): <açıklama>

Türler: feat · fix · refactor · docs · test · chore · ci · i18n
```

**Örnekler:**
```
feat(settings): add privacy tab with telemetry toggle
fix(ollama): handle connection timeout gracefully
i18n(tr): add missing keys for onboarding wizard
docs: update contributing guide
```

### PR Başlığı

```
feat(vscode): <ne eklendi>
fix(webview): <ne düzeltildi>
i18n: improve <Dil> translation
i18n: add <Dil> translation
```

### Dal Adlandırma

```
feat/<kısa-açıklama>
fix/<sorun-no>-kısa-açıklama
i18n/<dil-kodu>
docs/<belge-adı>
```

---

## Çeviri Katkısı

Nexus 13 dili destekler. Kendi dilinle katkıda bulunmak için tam rehber:

### Mevcut Çeviriyi İyileştirme

```bash
# Dil dosyasını aç (örn. Fransızca)
code apps/vscode/webview-ui/src/i18n/locales/fr.json
```

Kurallar:
- JSON **anahtarlarını** değiştirme — yalnızca değerleri çevir
- `_info` bloğunu değiştirme
- `{{değişken}}` yer tutucularını aynı bırak
- API, JSON, URL, VS Code gibi teknik terimleri çevirme

```bash
# Değişiklikleri commit et
git commit -m "i18n: improve French translation"
```

### Yeni Dil Ekleme

1. `en.json`'u kopyala, [BCP 47 etiketi](https://www.iana.org/assignments/language-subtag-registry) ile adlandır:
   ```bash
   cp apps/vscode/webview-ui/src/i18n/locales/en.json \
      apps/vscode/webview-ui/src/i18n/locales/vi.json
   ```

2. `_info` bloğunu güncelle:
   ```json
   {
     "_info": {
       "language": "Vietnamese",
       "nativeName": "Tiếng Việt",
       "code": "vi",
       "contributors": ["@senin-github-kullanici-adin"],
       "completion": "0%",
       "lastUpdated": "2026-10"
     }
   }
   ```

3. Locale'i kaydet: `apps/vscode/webview-ui/src/i18n/index.ts`

4. PR aç: `i18n: add Vietnamese translation`

**Tam rehber:** [CONTRIBUTING_TRANSLATION.md](../CONTRIBUTING_TRANSLATION.md)

---

## Bug Bildirme

İyi bir bug raporu şunları içerir:

1. **Nexus sürümü** — Ayarlar → Hakkında → Sürüm
2. **İşletim sistemi ve VS Code sürümü**
3. **Yeniden oluşturma adımları** — ne yaptın, ne bekliyordun, ne oldu
4. **Log çıktısı** — VS Code → Help → Toggle Developer Tools → Console

### Issue Şablonları

| Şablon | Kullanım |
|--------|---------|
| Bug Report | Hata bildir |
| Feature Request | Özellik öner |
| [Translation Request](../issues/new?template=translation.yml) | Yeni dil veya çeviri sorunu |

---

## Katkı Boyutlarına Göre Süreç

| Katkı Türü | Süreç |
|-----------|-------|
| Yazım hatası, belge düzeltme | Doğrudan PR aç |
| Küçük bug fix | Issue açmadan PR aç (açıklama yaz) |
| Yeni özellik | Önce issue aç, tartış, sonra PR |
| Büyük refactoring | Mutlaka issue veya tartışma başlat |
| Güvenlik açığı | Özel olarak bildir (bkz. [security.md](./security.md)) |

---

## Proje Yapısı

```
cline/
├── apps/
│   ├── vscode/                 ← VS Code uzantısı
│   │   ├── src/                ← Extension host (Node.js)
│   │   ├── webview-ui/src/     ← React arayüzü
│   │   │   └── i18n/locales/   ← Çeviri dosyaları
│   │   └── proto/              ← gRPC protokol tanımları
│   ├── cli/                    ← CLI uygulaması
│   └── examples/desktop-app/  ← Tauri masaüstü uygulaması
├── sdk/packages/               ← @nexus/* paylaşımlı paketler
│   ├── shared/
│   ├── llms/
│   ├── agents/
│   └── core/
├── docs/                       ← Bu dokümantasyon
└── .github/workflows/          ← CI/CD pipeline'ları
```

### Kilit Dosyalar

| Dosya | Açıklama |
|-------|---------|
| `apps/vscode/src/extension.ts` | Uzantı giriş noktası |
| `apps/vscode/webview-ui/src/App.tsx` | React kök bileşeni |
| `apps/vscode/webview-ui/src/context/ExtensionStateContext.tsx` | Merkezi durum yönetimi |
| `sdk/packages/llms/` | Provider adaptörleri |
| `sdk/packages/agents/` | Ajan orkestrasyon mantığı |

---

## Kod Stili

Nexus, [Biome](https://biomejs.dev) kullanır. Ayarlar `apps/vscode/biome.jsonc` dosyasında:

```bash
# Lint kontrolü
bun run lint

# Otomatik format
bun run format:fix
```

Editörde otomatik formatlamak için VS Code Biome uzantısını yükle.

---

## Sorularınız İçin

- **GitHub Discussions:** [github.com/probaba328/cline/discussions](https://github.com/probaba328/cline/discussions)
- **Issues:** [github.com/probaba328/cline/issues](https://github.com/probaba328/cline/issues)
- **Çeviri soruları:** `i18n` etiketiyle issue aç
