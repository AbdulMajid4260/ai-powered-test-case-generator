# Frontend - AI Test Case Generator (React + Vite)

## Run
```bash
cd frontend
npm install
npm run dev
```
Open http://127.0.0.1:5173. The backend must run at http://127.0.0.1:8000
(override with `VITE_API_BASE_URL` in `.env`, see `.env.example`).

## Pages
| Route | Page |
|---|---|
| `/` | Home |
| `/generate` | Generate test cases, filter, export |
| `/history` | Past requirements with date/time, view, reuse, delete |
| `/about` | About us |
| `/contact` | Contact us |

Light/dark mode: toggle in the navbar. The choice is saved in localStorage.

## API used
| Method | URL | Notes |
|---|---|---|
| POST | /api/generate-test-cases | `{"requirement": "..."}` -> `{"test_cases": [...]}` |
| POST | /api/export/csv | `{"test_cases": [...]}` -> CSV file |
| POST | /api/export/json | `{"test_cases": [...]}` -> JSON file |
| GET | /api/history | `{"items": [{id, created_at, requirement, test_case_count, positive_count, negative_count, model}]}` newest first |
| GET | /api/history/{id} | full record including `test_cases` |
| DELETE | /api/history/{id} | 204 |

Errors: any 4xx/5xx with `{"detail": "message"}` is shown to the user.
Backend CORS must allow origins http://127.0.0.1:5173 and http://localhost:5173,
methods GET/POST/DELETE, and expose the `Content-Disposition` header.

## Structure
- `src/App.jsx` - layout and routes
- `src/pages/` - Home, Generate, History, About, Contact
- `src/components/` - Navbar, Footer, ThemeToggle, RequirementForm, ResultsPanel, ResultsTable, ErrorBanner, Badge
- `src/hooks/useTheme.js` - theme state
- `src/api.js` - all backend calls and error mapping
- `src/utils/` - validation, errors, formatting

Before submitting, edit the placeholders in `src/pages/About.jsx` and `src/pages/Contact.jsx`
(team names, email, repo URL) and the brand name in `Navbar.jsx` / `Footer.jsx`.
