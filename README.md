# GitHub Stack Analyzer

A Chrome extension that analyzes and displays the technology stack of any GitHub repository. Instantly see what languages, frameworks, libraries, databases, and tools a project uses — without reading a single line of code.

## Features

- **Automatic Detection** — Identifies 60+ technologies from file names, directory structures, and dependency manifests
- **Popup Dashboard** — Click the extension icon to see a categorized breakdown with confidence scores
- **Inline Badge** — Shows a tech count badge directly on GitHub repository pages
- **Dependency Parsing** — Reads `package.json`, `requirements.txt`, `Gemfile`, `go.mod`, `Cargo.toml`, `composer.json`, and more
- **Dark Mode Support** — Automatically adapts to your system theme and GitHub's dark mode
- **Caching** — Results are cached for 1 hour to avoid redundant analysis

## Technology Categories

| Category | Examples |
|----------|----------|
| Languages | JavaScript, TypeScript, Python, Go, Rust, Java, Ruby, PHP, C#, Swift, Kotlin |
| Frameworks | React, Vue, Angular, Next.js, Nuxt, Svelte, Django, Flask, FastAPI, Rails, Express, Spring Boot, Laravel |
| Styling | Tailwind CSS, Sass/SCSS, Styled Components, CSS Modules |
| Testing | Jest, Vitest, Pytest, Mocha, Cypress, Playwright |
| Build Tools | Webpack, Vite, esbuild, Rollup, Turbopack |
| Databases | PostgreSQL, MongoDB, Redis, MySQL, SQLite |
| DevOps | Docker, GitHub Actions, GitLab CI, Jenkins |
| Infrastructure | Terraform, Kubernetes |
| Libraries | GraphQL, Prisma, Storybook, and more |

## Installation (from source)

1. Clone the repository:
   ```bash
   git clone https://github.com/anthropics/github-stack-analyzer.git
   cd github-stack-analyzer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable **Developer mode** (top-right toggle)
   - Click **Load unpacked**
   - Select the `dist/` directory

## Usage

1. Navigate to any GitHub repository page (e.g., `https://github.com/facebook/react`)
2. Click the **Stack Analyzer** extension icon in the toolbar to see the full analysis
3. A badge on the page shows the number of detected technologies
4. Click any technology in the popup to see which files and dependencies matched

## Development

```bash
# Install dependencies
npm install

# Start development server (hot reload)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

## Architecture

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

## Tech Stack

- **TypeScript** — Strict mode, ES2020 target
- **Vite** + **@crxjs/vite-plugin** — Build and hot-reload Chrome extensions
- **Vitest** — Unit and integration testing
- **ESLint** + **Prettier** — Code quality and formatting

## Related Projects

- [rverton/webanalyze](https://github.com/rverton/webanalyze)
- [projectdiscovery/wappalyzergo](https://github.com/projectdiscovery/wappalyzergo)
- [johnmichel/Library-Detector-for-Chrome](https://github.com/johnmichel/Library-Detector-for-Chrome)
- [enthec/webappanalyzer](https://github.com/enthec/webappanalyzer)
- [dochne/wappalyzer](https://github.com/dochne/wappalyzer)
- [tunetheweb/wappalyzer](https://github.com/tunetheweb/wappalyzer)
- [oleg-shilo/Stack-Analyser](https://github.com/warestack/stack-analyzer)

## License

Apache 2.0
