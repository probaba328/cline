# Changelog

Nexus sürüm geçmişi. [Keep a Changelog](https://keepachangelog.com/tr/1.0.0/) formatına ve [Semantic Versioning](https://semver.org/lang/tr/) kurallarına uyar.

---

## Semantic Versioning Kuralları

| Sürüm | Ne Zaman Artar | Örnek |
|-------|---------------|-------|
| **MAJOR** (x.0.0) | Geriye dönük uyumsuz değişiklik — mevcut yapılandırmayı, API'yi veya davranışı kıran değişiklik | `1.0.0` → `2.0.0` |
| **MINOR** (0.x.0) | Geriye dönük uyumlu yeni özellik — kurulum değişmeden kullanılabilir | `1.0.0` → `1.1.0` |
| **PATCH** (0.0.x) | Geriye dönük uyumlu hata düzeltmesi veya çeviri güncellemesi | `1.0.0` → `1.0.1` |

**Pre-release etiketleri:**
- `1.0.0-beta.N` — Genel kullanıma açık beta; büyük değişiklikler henüz olabilir
- `1.0.0-rc.N` — Release candidate; yalnızca kritik düzeltmeler bekleniyor
- `1.0.0` — Kararlı sürüm

**Değişiklik kategorileri:**

| Etiket | Açıklama |
|--------|---------|
| `Eklendi` | Yeni özellik |
| `Değiştirildi` | Mevcut özellikte değişiklik |
| `Düzeltildi` | Hata düzeltmesi |
| `Kaldırıldı` | Artık kullanılmayan özellik |
| `Güvenlik` | Güvenlik açığı düzeltmesi |
| `i18n` | Çeviri güncelleme veya yeni dil |
| `Belgeler` | Dokümantasyon değişikliği |

---

## [1.0.0-beta.1] — 2026-10-09

Nexus'un ilk beta sürümü. [Cline](https://github.com/cline/cline) projesinin (`v4.1.14`) üzerine inşa edilmiştir; uluslararasılaştırma, gizlilik ve kullanıcı deneyimi odaklı değişiklikler içerir.

### Eklendi

**Onboarding Sihirbazı**
- İlk açılışta 6 adımlı kurulum sihirbazı: Hoş Geldin → Dil → Telemetry → Model → API Key → Hazır
- Her adım atlanabilir; "Tümünü Atla" ile tek seferde tamamlanabilir
- Cihaz dilini otomatik algılama (`navigator.language` → BCP 47 eşleştirme)
- Provider'a göre dinamik API key giriş ekranı
- Ollama seçildiğinde çevrimdışı mod paneli ve kurulum adımları

**AI Model Seçimi İyileştirmeleri**
- Settings → AI Modeli: Claude, GPT-4o, OpenRouter, Ollama için "Önerilen Modeller" hızlı seçim şeridi
- Ollama / LM Studio seçildiğinde "Offline mode active" göstergesi
- Ollama model listesi boşken katlanır kurulum rehberi (4 adım + önerilen modeller)

**Settings Yeniden Yapılandırma**
- Yeni 5 sekmeli yapı: **Genel · AI Modeli · Gizlilik · Güvenlik · Hakkında**
- **Gizlilik sekmesi:** Telemetry toggle; neyin toplandığı/toplanmadığı açık bilgi kutuları
- **Güvenlik sekmesi:** SecretStorage durumu, OS başına keychain tablosu
- **Genel sekmesi:** Dil seçimi + VS Code tema picker linki
- **Hakkında sekmesi:** Sürüm, lisans, GitHub linkleri, çeviri katkısı kartı

**Topluluk Çeviri Sistemi**
- Tüm 13 locale dosyasına `_info` header bloğu eklendi (`language`, `nativeName`, `code`, `contributors`, `completion`, `lastUpdated`)
- `.github/ISSUE_TEMPLATE/translation.yml` — yapılandırılmış yeni dil talebi formu
- `crowdin.yml` güncellendi: `_info` bloğu Crowdin çevirilerinden dışlandı

**CI/CD Pipeline'ları**
- `.github/workflows/build.yml` — PR'larda TypeScript tip kontrolü + lint + birim testler
- `.github/workflows/release.yml` — tag push ile otomatik marketplace yayını + GitHub Release
- `.github/workflows/i18n-check.yml` — locale değişikliklerinde eksik çevirileri PR yorumu olarak bildir

**Dokümantasyon**
- `docs/getting-started.md` — kurulum ve API key rehberi (6 provider)
- `docs/models.md` — model karşılaştırması, Ollama kurulumu, seçim rehberi
- `docs/security.md` — güvenlik mimarisi, telemetry detayları
- `docs/contributing.md` — kod ve çeviri katkısı kılavuzu
- `docs/faq.md` — Türkçe + İngilizce SSS (30+ soru)
- `CONTRIBUTING_TRANSLATION.md` — adım adım çeviri katkı rehberi (Crowdin + GitHub PR)

**Çeviri**
- 13 locale'de tam çeviri: `tr · de · fr · es · pt-BR · ja · ko · zh-CN · zh-TW · ar · ru · hi`
- `README.md` güncellendi: iki dilli başlık, native yazımla dil tablosu, Katkıcı sütunu

### Değiştirildi

- Settings `api-config` sekme kimliği → `ai-model` olarak yeniden adlandırıldı (tüm referanslar güncellendi)
- `GeneralSettingsSection` telemetry toggle → `PrivacySection`'a taşındı
- Onboarding: `OnboardingView` → `NexusSetupWizard` ile değiştirildi

### Altyapı (Cline 4.1.14 tabanından devralınan)

> Aşağıdaki özellikler Nexus'a Cline'dan miras kalmıştır ve bu sürümde Nexus tarafından değiştirilmemiştir.

- Plan/Act iki modlu çalışma; her mod için ayrı model desteği
- gRPC tabanlı extension host ↔ webview iletişimi
- VS Code SecretStorage ile şifrelenmiş API key saklama
- MCP (Model Context Protocol) sunucu entegrasyonu
- 7 provider: Anthropic, OpenAI, Google, AWS Bedrock, Azure, OpenRouter, Ollama, LM Studio
- Diff görünümü, terminal entegrasyonu, tarayıcı kullanımı
- PostHog tabanlı anonim telemetry (opt-in)

---

## Gelecek Planı

### [1.0.0-beta.2] — Planlanan

- [ ] Tüm locale dosyaları için i18next anahtarlarını tam tarama
- [ ] Onboarding sihirbazı animasyon iyileştirmeleri
- [ ] Marketplace yayını (VSCE_PAT yapılandırması)

### [1.0.0-rc.1] — Planlanan

- [ ] Kapsamlı beta geri bildirimi değerlendirmesi
- [ ] Performans profili ve bellek optimizasyonu
- [ ] E2E test suite güncellemesi

### [1.0.0] — Planlanan

- [ ] Kararlı sürüm
- [ ] Crowdin projesi canlı
- [ ] Topluluk çeviri katkısı açılışı

---

*Eski Nexus/Cline sürüm geçmişi (4.1.14 ve öncesi) için [git geçmişine](https://github.com/probaba328/cline/commits/main) bakın.*
