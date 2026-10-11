# Changeset Dizini — Nexus

Bu dizin, [Changesets](https://github.com/changesets/changesets) aracı ile yönetilir.

## Hızlı Başlangıç

```bash
# Yeni bir changeset oluştur (feature/fix sonrası)
bunx changeset

# Sürümü güncelle (changeset'leri tüket ve CHANGELOG'u güncelle)
bunx changeset version

# Yayınla (marketplace push için)
bunx changeset publish
```

## Changeset Dosyası Formatı

```markdown
---
"nexus": minor
---

Kullanıcıya ne değiştiğini açıklayan kısa bir cümle.
```

**Paket adları:**

| Paket | Ne Zaman Kullanılır |
|-------|-------------------|
| `"nexus": patch` | Bug fix, çeviri güncellemesi, belge düzeltmesi |
| `"nexus": minor` | Yeni özellik (geriye uyumlu) |
| `"nexus": major` | Breaking change |
| `"@nexus/shared": patch` | SDK değişikliği |

## Temizlik Notu

Bu dizinde `"claude-dev"` paket adını kullanan eski Cline changeset dosyaları bulunmaktadır.
Bunlar `1.0.0-beta.1` sürümüne dahil edilmiştir ve silinmeleri gerekir:

```bash
# Eski Cline changeset dosyalarını temizle
cd .changeset
ls *.md | grep -v README | xargs rm -f
```

Veya her birini elle sil:
- `brave-moons-refuse.md`
- `clear-task-settings-overlay.md`
- `gold-otters-march.md`
- `hidden-mode-prompts-history.md`
- `lazy-pugs-cheer.md`
- `lucky-doors-shine.md`
- `pink-ants-glow.md`
- `proud-crabs-compact.md`
- `response-header-copy-button.md`
- `tidy-crabs-compact.md`
- `tidy-crabs-rest.md`
- `tidy-owls-return.md`
- `view-changes-hidden-until-changes.md`
- `witty-rooms-listen.md`

## Workflow

```
özellik geliştir
      │
      ▼
bunx changeset      ← paket ve tür seç, açıklama yaz
      │
      ▼
git commit + PR
      │
      ▼
PR merge → main
      │
      ▼
CI: sürüm PR'ı otomatik açar  (changeset version)
      │
      ▼
sürüm PR merge
      │
      ▼
CI: git tag + marketplace yayını  (.github/workflows/release.yml)
```
