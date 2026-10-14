# AI-Powered Test Case Generator – Frontend

A clean, accessible vanilla HTML/CSS/JS frontend for the AI-powered test case generator.

## Overview

This frontend lets users:
- Enter a plain-English software requirement (up to 3,000 characters)
- Send it to the FastAPI backend which calls an LLM
- View the generated test cases in a structured, sortable table
- Export results as **CSV** (UTF-8 BOM for Excel compatibility) or **JSON**

## Project Structure

```
frontend/
├── index.html   # App shell, semantic HTML5, fully accessible (ARIA)
├── style.css    # Design tokens, responsive layout, mobile card view
└── app.js       # Fetch API, input validation, response parsing, export logic
```

## Getting Started

1. **Start the backend** (FastAPI) at `http://127.0.0.1:8000` – see the backend README.
2. Open `index.html` in your browser directly, or serve with any static file server:
   ```bash
   npx serve .
   # or
   python -m http.server 5500
   ```
3. Enter a requirement, press **Generate test cases** (or `Ctrl + Enter`).

## API Contract

The frontend `POST`s to `/api/generate-test-cases` with:

```json
{ "requirement": "<plain-english text>" }
```

It expects a `200 OK` with:

```json
{
  "test_cases": [
    {
      "test_case_id": "TC-001",
      "title": "...",
      "preconditions": ["..."],
      "test_steps": ["..."],
      "expected_result": "...",
      "priority": "High | Medium | Low",
      "test_type": "Positive | Negative"
    }
  ]
}
```

## Key Design Decisions

| Concern | Approach |
|---|---|
| Security | LLM API key lives only in the backend; nothing secret in this file |
| Accessibility | ARIA live regions, `role="alert"`, keyboard shortcut (`Ctrl+Enter`) |
| CSV injection | Cells starting with `= + - @` get a leading apostrophe |
| Timeout | 90 s `AbortController` timeout (LLM calls can be slow) |
| Error UX | Friendly, categorised error messages for network / HTTP / AI errors |

## Contributing

Work on a **feature branch** and open a pull request into `main`:

```bash
git checkout -b feature/<your-name>-<short-description>
git add .
git commit -m "feat: describe your change"
git push origin feature/<your-name>-<short-description>
```

## License

MIT
