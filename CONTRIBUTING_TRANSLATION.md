# Contributing Translations

Nexus uses [i18next](https://www.i18next.com/) for internationalization. All locale files live in:

```
apps/vscode/webview-ui/src/i18n/locales/
```

## How to contribute a translation

1. **Fork** the repository: https://github.com/probaba328/cline
2. Find the locale file for your language (e.g. `de.json` for German)
3. Fill in each empty string value by translating from `en.json` (the source)
4. Open a pull request with the title: `i18n: add [Language] translation`

## Rules

- Keep **all keys** exactly as they are — only translate the values
- Use natural, idiomatic phrasing — not literal word-for-word translations
- Do not translate technical terms that are kept in English (e.g. API, JSON, URL)
- Test your translation by switching VS Code's display language

## Adding a new language

If your language isn't listed yet:
1. Copy `apps/vscode/webview-ui/src/i18n/locales/en.json`
2. Name the new file with the correct [BCP 47 tag](https://www.iana.org/assignments/language-subtag-registry) (e.g. `vi.json` for Vietnamese)
3. Register it in `apps/vscode/webview-ui/src/i18n/index.ts`
4. Open a pull request

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

## Questions?

Open an issue at https://github.com/probaba328/cline/issues with the label `i18n`.
