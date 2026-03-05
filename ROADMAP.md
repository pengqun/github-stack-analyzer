# GitHub Stack Analyzer — Project Roadmap

## Current Status

**Phase: Post-MVP — Quality, Features & Launch Preparation**

The project has completed its core implementation phases and is now focused on polish, expanded coverage, and preparing for public release.

### Milestones Achieved

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Project initialized with license (Apache 2.0) and README | Done |
| 2 | Competitive landscape researched (7 related projects catalogued) | Done |
| 3 | Core concept defined (Chrome extension for GitHub repo stack analysis) | Done |
| 4 | Project scaffolding complete (Vite + TypeScript + Chrome Extension MV3) | Done |
| 5 | Core detection engine implemented (pattern matching, manifest parsing, categorization) | Done |
| 6 | Technology fingerprint database seeded (105 technologies) | Done |
| 7 | Chrome extension UI complete (popup, content script badge, loading/empty/error states) | Done |
| 8 | Unit & integration tests (63 tests across 5 test suites) | Done |
| 9 | CI/CD pipeline (GitHub Actions: lint, format, test, build) | Done |
| 10 | Error handling (private repos, rate limiting, empty repos, network errors) | Done |
| 11 | Dark mode support (system preference + GitHub theme detection) | Done |
| 12 | Settings/options page (badge toggle, confidence filter, category filter) | Done |
| 13 | Content pattern matching (regex-based file content detection) | Done |
| 14 | README with install instructions, usage guide, and architecture diagram | Done |

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

### Phase 1 — Project Scaffolding & Foundation ✅ COMPLETE

**Goal:** Establish a production-grade project structure so development can proceed efficiently.

| Priority | Task | Status |
|----------|------|--------|
| P0 | Create `manifest.json` (Manifest V3) | Done |
| P0 | Initialize `package.json` | Done |
| P0 | Set up directory structure | Done |
| P1 | Add `.gitignore` | Done |
| P1 | Configure build tooling (Vite + TypeScript) | Done |
| P1 | Add linting & formatting (ESLint + Prettier) | Done |
| P2 | Set up CI pipeline (GitHub Actions) | Done |

---

### Phase 2 — Core Detection Engine ✅ COMPLETE

**Goal:** Build the technology-detection logic that powers the extension.

| Priority | Task | Status |
|----------|------|--------|
| P0 | Design the tech fingerprint database schema | Done |
| P0 | Seed the fingerprint database (105 technologies) | Done |
| P0 | Implement repo file-tree parser (DOM scraping, multiple strategies) | Done |
| P0 | Implement pattern-matching engine (glob, dependency, content patterns) | Done |
| P1 | Parse manifest files (package.json, requirements.txt, Gemfile, go.mod, Cargo.toml, composer.json) | Done |
| P1 | Categorize detected technologies (10 categories, sorted by confidence) | Done |
| P2 | Add confidence scoring (0–100, file/dep/content weights) | Done |

---

### Phase 3 — Chrome Extension UI ✅ COMPLETE

**Goal:** Deliver a polished user-facing interface that surfaces the detected stack.

| Priority | Task | Status |
|----------|------|--------|
| P0 | Build popup UI shell | Done |
| P0 | Display detected technologies (categorized, with confidence scores) | Done |
| P0 | Content script integration (inline badge on GitHub pages) | Done |
| P1 | Loading & empty states | Done |
| P1 | Error states (private repo, rate limit, network error) | Done |
| P1 | Tech detail expansion (signals breakdown) | Done |
| P2 | Theme support (system preference + GitHub data-color-mode) | Done |
| P2 | Settings page (badge toggle, confidence filter, category filter) | Done |

---

### Phase 4 — Quality, Testing & Polish ✅ MOSTLY COMPLETE

**Goal:** Ensure reliability and prepare for public release.

| Priority | Task | Status |
|----------|------|--------|
| P0 | Unit tests for detection engine | Done (46 unit tests) |
| P0 | Integration tests | Done (14 pipeline tests) |
| P0 | Error handling & edge cases | Done |
| P1 | End-to-end tests (Playwright) | Not started |
| P1 | Performance optimization (caching) | Done |
| P2 | Accessibility audit | Not started |

---

### Phase 5 — Launch & Growth 🔜 NEXT

**Goal:** Release publicly and build an active user base.

| Priority | Task | Status |
|----------|------|--------|
| P0 | Chrome Web Store listing (screenshots, description, privacy policy) | Not started |
| P0 | Update README with screenshots | Partial (text done, screenshots pending) |
| P1 | Community contribution guide (`CONTRIBUTING.md`) | Not started |
| P1 | Firefox / Edge port (WebExtensions API) | Not started |
| P2 | Analytics & feedback | Not started |
| P2 | GitHub API authentication (higher rate limits, private repos) | Not started |

---

## Architecture Overview

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
│  │  │  ├─ Content matcher   │  │             │
│  │  │  └─ Categorizer       │  │             │
│  │  └───────────────────────┘  │             │
│  │  ┌───────────────────────┐  │             │
│  │  │  Fingerprint Database │  │             │
│  │  │  (105 technologies)   │  │             │
│  │  └───────────────────────┘  │             │
│  └─────────────────────────────┘             │
└─────────────────────────────────────────────┘
```

---

*Last updated: 2026-03-05*
