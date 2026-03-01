# GitHub Stack Analyzer — Project Roadmap

## Current Status

**Phase: Planning / Pre-Development**

The project is in its earliest stage. The vision is clear — a **Chrome extension that analyzes and displays the technology stack of any GitHub repository** — but no implementation code exists yet.

### Milestones Achieved

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Project initialized with license (Apache 2.0) and README | Done |
| 2 | Competitive landscape researched (7 related projects catalogued) | Done |
| 3 | Core concept defined (Chrome extension for GitHub repo stack analysis) | Done |

### Related Projects Reviewed

The following tools have been surveyed as prior art:

- **webanalyze / wappalyzergo** — Go-based web technology detection (CLI / library)
- **Library-Detector-for-Chrome** — Chrome extension that detects JS libraries on a page
- **webappanalyzer / wappalyzer forks** — Community-maintained technology fingerprinting databases
- **Stack-Analyser** — Full-stack technology analysis tool

---

## Strategic Roadmap

The roadmap is organized into **five phases**, each building on the previous one.

---

### Phase 1 — Project Scaffolding & Foundation

**Goal:** Establish a production-grade project structure so development can proceed efficiently.

| Priority | Task | Details |
|----------|------|---------|
| P0 | Create `manifest.json` (Manifest V3) | Define extension name, version, permissions (`activeTab`, `storage`), content scripts targeting `github.com`, popup, and service worker |
| P0 | Initialize `package.json` | Set up Node.js project with build scripts |
| P0 | Set up directory structure | `src/`, `src/popup/`, `src/content/`, `src/background/`, `src/utils/`, `assets/`, `tests/` |
| P1 | Add `.gitignore` | Ignore `node_modules/`, `dist/`, `.env`, build artifacts |
| P1 | Configure build tooling | Webpack or Vite for bundling the extension; TypeScript support |
| P1 | Add linting & formatting | ESLint + Prettier with shared config |
| P2 | Set up CI pipeline | GitHub Actions for lint, test, and build on each push |

---

### Phase 2 — Core Detection Engine

**Goal:** Build the technology-detection logic that powers the extension.

| Priority | Task | Details |
|----------|------|---------|
| P0 | Design the tech fingerprint database schema | JSON/YAML structure defining patterns: file names, import paths, package.json deps, config file markers |
| P0 | Seed the fingerprint database | Cover the top ~50 technologies: React, Vue, Angular, Next.js, Django, Rails, Express, Tailwind, Docker, Terraform, etc. |
| P0 | Implement repo file-tree parser | Use GitHub's API (or scrape the DOM) to read the file tree of the current repo |
| P0 | Implement pattern-matching engine | Match file names, directory structures, and config file contents against the fingerprint database |
| P1 | Parse `package.json` / `requirements.txt` / `Gemfile` / `go.mod` etc. | Extract dependency lists from common manifest files |
| P1 | Categorize detected technologies | Group results by category: framework, language, database, CI/CD, infrastructure, styling, testing, etc. |
| P2 | Add confidence scoring | Assign confidence levels based on number and quality of signals |

---

### Phase 3 — Chrome Extension UI

**Goal:** Deliver a polished user-facing interface that surfaces the detected stack.

| Priority | Task | Details |
|----------|------|---------|
| P0 | Build popup UI shell | HTML/CSS popup triggered by clicking the extension icon |
| P0 | Display detected technologies | Render categorized list with tech logos/icons and names |
| P0 | Content script integration | Inject a badge or sidebar on GitHub repo pages showing the stack |
| P1 | Loading & empty states | Spinner while analyzing; friendly message when no techs detected |
| P1 | Tech detail expansion | Click a technology to see which files/signals matched |
| P2 | Theme support | Respect GitHub's light/dark mode |
| P2 | Settings page | Let users toggle inline display, choose categories to show/hide |

---

### Phase 4 — Quality, Testing & Polish

**Goal:** Ensure reliability and prepare for public release.

| Priority | Task | Details |
|----------|------|---------|
| P0 | Unit tests for detection engine | Jest/Vitest tests for pattern matching, parsing, and categorization |
| P0 | Integration tests | Test the full flow from repo URL to rendered stack |
| P1 | End-to-end tests | Playwright or Puppeteer tests running against real GitHub pages |
| P1 | Performance optimization | Cache results per repo; lazy-load the fingerprint database |
| P1 | Error handling & edge cases | Private repos, empty repos, very large repos, rate-limited API responses |
| P2 | Accessibility audit | Keyboard navigation, screen reader support, ARIA labels |

---

### Phase 5 — Launch & Growth

**Goal:** Release publicly and build an active user base.

| Priority | Task | Details |
|----------|------|---------|
| P0 | Chrome Web Store listing | Screenshots, description, privacy policy |
| P0 | Update README with install instructions, screenshots, and usage guide | |
| P1 | Community contribution guide | `CONTRIBUTING.md` with instructions for adding new tech fingerprints |
| P1 | Firefox / Edge port | Adapt for cross-browser support (WebExtensions API) |
| P2 | Analytics & feedback | Optional anonymous usage metrics; in-extension feedback form |
| P2 | GitHub API integration (authenticated) | Use a personal access token for higher rate limits and private repo support |

---

## Prioritized Next Steps (Immediate Actions)

The following tasks should be tackled **first**, in this order:

1. **Initialize the project scaffold** — `package.json`, `manifest.json`, directory structure, `.gitignore`
2. **Set up the build pipeline** — Webpack/Vite + TypeScript so code can be compiled and loaded as an extension
3. **Design and seed the fingerprint database** — This is the intellectual core of the project
4. **Implement the file-tree parser** — Read the repo structure from a GitHub page
5. **Build the pattern-matching engine** — Connect the parser to the fingerprint database
6. **Create a minimal popup UI** — Display results to validate the end-to-end flow
7. **Add tests and CI** — Lock in quality before expanding the fingerprint database

---

## Architecture Overview (Proposed)

```
┌─────────────────────────────────────────────┐
│              Chrome Extension                │
│                                              │
│  ┌──────────┐   ┌────────────────────────┐  │
│  │  Popup   │   │   Content Script        │  │
│  │   UI     │   │   (github.com/*)        │  │
│  └────┬─────┘   └──────────┬─────────────┘  │
│       │                    │                 │
│       └────────┬───────────┘                 │
│                ▼                             │
│  ┌─────────────────────────────┐             │
│  │     Background Service      │             │
│  │        Worker               │             │
│  │  ┌───────────────────────┐  │             │
│  │  │  Detection Engine     │  │             │
│  │  │  ├─ File-tree parser  │  │             │
│  │  │  ├─ Manifest parser   │  │             │
│  │  │  ├─ Pattern matcher   │  │             │
│  │  │  └─ Categorizer       │  │             │
│  │  └───────────────────────┘  │             │
│  │  ┌───────────────────────┐  │             │
│  │  │  Fingerprint Database │  │             │
│  │  │  (JSON)               │  │             │
│  │  └───────────────────────┘  │             │
│  └─────────────────────────────┘             │
└─────────────────────────────────────────────┘
```

---

*Last updated: 2026-03-01*
