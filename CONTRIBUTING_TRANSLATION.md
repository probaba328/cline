# Contributing Translations

Nexus is built for global developer communities — your translation makes it accessible to thousands more developers. All contributions are welcome, from fixing a typo to adding a brand-new language.

---

## Two ways to contribute

### Option A — Crowdin (recommended for non-technical contributors)

Crowdin is a web-based translation editor. You do not need to know Git, JSON, or how to run code.

1. Go to the Nexus project on Crowdin:
   **https://crowdin.com/project/nexus-ide** *(link will be live after project setup)*
2. Create a free Crowdin account if you don't have one
3. Select your language
4. Translate strings in the online editor — you get context, suggestions, and a preview
5. Submit your translations — a maintainer reviews and approves them
6. Approved translations are automatically synced to the repository via a weekly pull request

### Option B — GitHub pull request (for developers)

1. Fork the repository: https://github.com/probaba328/cline
2. Find the locale file for your language in `apps/vscode/webview-ui/src/i18n/locales/`
3. Fill in or correct the string values — **keys must not change**
4. Open a pull request with the title: `i18n: improve [Language] translation`

---

## Translation rules

| Rule | Detail |
|------|--------|
| **Translate values, not keys** | JSON keys are identifiers used in code — never change them |
| **Natural phrasing** | Use idiomatic expressions, not word-for-word literal translations |
| **Keep technical terms** | Do not translate: API, JSON, URL, VS Code, MCP, OAuth |
| **Keep the `_meta` block unchanged** | It is internal metadata, not user-visible text |
| **Placeholders** | Strings with `{{variable}}` must keep the placeholder exactly as-is |
| **Punctuation** | Match the source string's punctuation style (e.g. ellipsis `...`, exclamation mark) |

---

## Adding a new language

If your language is not listed yet:

1. Copy `apps/vscode/webview-ui/src/i18n/locales/en.json` to a new file using the [BCP 47 language tag](https://www.iana.org/assignments/language-subtag-registry) (e.g. `vi.json` for Vietnamese, `id.json` for Indonesian)
2. Update `_meta.language` to the language name in English
3. Register the new locale in `apps/vscode/webview-ui/src/i18n/index.ts`
4. Open a pull request titled: `i18n: add [Language] translation`

A maintainer will add your language to the Crowdin project so future contributors can use the web editor.

---

## File structure

```
apps/vscode/webview-ui/src/i18n/
├── index.ts              ← locale registry + auto-detect logic
└── locales/
    ├── en.json           ← source (English) — do not edit via Crowdin
    ├── tr.json           ← Turkish
    ├── de.json           ← German
    ├── fr.json           ← French
    ├── es.json           ← Spanish
    ├── pt-BR.json        ← Portuguese (Brazil)
    ├── ja.json           ← Japanese
    ├── ko.json           ← Korean
    ├── zh-CN.json        ← Chinese (Simplified)
    ├── zh-TW.json        ← Chinese (Traditional)
    ├── ar.json           ← Arabic
    ├── ru.json           ← Russian
    └── hi.json           ← Hindi
```

---

## Supported locales

| File | Language | Status |
|------|----------|--------|
| `en.json` | English | ✅ Complete (source) |
| `tr.json` | Turkish | ✅ Complete |
| `de.json` | German | ✅ Complete |
| `fr.json` | French | ✅ Complete |
| `es.json` | Spanish | ✅ Complete |
| `pt-BR.json` | Portuguese (Brazil) | ✅ Complete |
| `ja.json` | Japanese | ✅ Complete |
| `ko.json` | Korean | ✅ Complete |
| `zh-CN.json` | Chinese (Simplified) | ✅ Complete |
| `zh-TW.json` | Chinese (Traditional) | ✅ Complete |
| `ar.json` | Arabic | ✅ Complete |
| `ru.json` | Russian | ✅ Complete |
| `hi.json` | Hindi | ✅ Complete |

---

## Crowdin sync workflow

The repository and Crowdin stay in sync automatically:

```
en.json changes on main
        │
        ▼
  GitHub Action uploads new source strings to Crowdin
        │
        ▼
  Translators work in the Crowdin editor
        │
        ▼
  Every Monday — GitHub Action downloads approved translations
        │
        ▼
  Pull request opened: "chore(i18n): sync translations from Crowdin"
        │
        ▼
  Maintainer reviews and merges
```

To trigger a manual sync, go to **Actions → Crowdin Sync → Run workflow**.

---

## Setting up Crowdin (maintainers only)

1. Create a project at https://crowdin.com
2. Add the following secrets to the GitHub repository:
   - `CROWDIN_PROJECT_ID` — numeric project ID from the Crowdin dashboard
   - `CROWDIN_PERSONAL_TOKEN` — API token from https://crowdin.com/settings#api-key
3. The `crowdin.yml` at the repository root configures source and target file paths automatically

---

## Questions?

Open an issue at https://github.com/probaba328/cline/issues with the label `i18n`.
