import type { ParsedDependencies, RepoInfo, AnalysisError } from './types';
import { GITHUB_RAW_BASE, MANIFEST_FILES } from './constants';

const FETCH_TIMEOUT_MS = 30_000;

/**
 * Build the raw.githubusercontent.com URL for a file in a repo.
 */
function rawUrl(repo: RepoInfo, filePath: string): string {
  return `${GITHUB_RAW_BASE}/${repo.owner}/${repo.repo}/${repo.branch}/${filePath}`;
}

/**
 * Fetch a raw file from GitHub with timeout and error classification.
 * Returns null if 404 or non-critical error. Throws AnalysisError for auth/rate-limit issues.
 */
async function fetchRawFile(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.status === 404) return null;

    if (response.status === 401 || response.status === 403) {
      const error: AnalysisError = {
        code: 'PRIVATE_REPO',
        message: 'This repository is private or access is restricted.',
        retryable: false,
      };
      throw error;
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const error: AnalysisError = {
        code: 'RATE_LIMITED',
        message: 'GitHub API rate limit reached. Please try again later.',
        retryable: true,
        retryAfterMs: retryAfter ? parseInt(retryAfter, 10) * 1000 : 60_000,
      };
      throw error;
    }

    if (!response.ok) return null;
    return await response.text();
  } catch (e) {
    // Re-throw AnalysisError
    if (e && typeof e === 'object' && 'code' in e) throw e;
    return null;
  }
}

/**
 * Parse dependencies from package.json content.
 */
export function parsePackageJson(content: string): string[] {
  try {
    const pkg = JSON.parse(content);
    const deps = new Set<string>();
    for (const key of ['dependencies', 'devDependencies', 'peerDependencies']) {
      if (pkg[key] && typeof pkg[key] === 'object') {
        Object.keys(pkg[key]).forEach((d) => deps.add(d));
      }
    }
    return [...deps];
  } catch {
    return [];
  }
}

/**
 * Parse dependencies from requirements.txt content.
 * Handles lines like: flask==2.0.0, django>=4.0, numpy
 */
export function parseRequirementsTxt(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('-'))
    .map((line) => line.split(/[>=<~![;]/)[0].trim())
    .filter(Boolean);
}

/**
 * Parse dependencies from Gemfile content.
 * Handles lines like: gem 'rails', '~> 7.0'
 */
export function parseGemfile(content: string): string[] {
  const gems: string[] = [];
  const gemPattern = /gem\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = gemPattern.exec(content)) !== null) {
    gems.push(match[1]);
  }
  return gems;
}

/**
 * Parse dependencies from go.mod content.
 * Handles lines like: require github.com/gin-gonic/gin v1.9.0
 */
export function parseGoMod(content: string): string[] {
  const deps: string[] = [];
  const lines = content.split('\n');
  let inRequire = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('require (')) {
      inRequire = true;
      continue;
    }
    if (trimmed === ')') {
      inRequire = false;
      continue;
    }
    if (inRequire || trimmed.startsWith('require ')) {
      const depMatch = trimmed.match(/^(?:require\s+)?([^\s]+)\s+/);
      if (depMatch) {
        deps.push(depMatch[1]);
      }
    }
  }
  return deps;
}

/**
 * Parse dependencies from Cargo.toml content.
 */
export function parseCargoToml(content: string): string[] {
  const deps: string[] = [];
  let inDeps = false;
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.match(/^\[.*dependencies.*\]$/)) {
      inDeps = true;
      continue;
    }
    if (trimmed.startsWith('[') && !trimmed.includes('dependencies')) {
      inDeps = false;
      continue;
    }
    if (inDeps) {
      const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=/);
      if (match) deps.push(match[1]);
    }
  }
  return deps;
}

/**
 * Parse dependencies from composer.json content.
 */
export function parseComposerJson(content: string): string[] {
  try {
    const data = JSON.parse(content);
    const deps = new Set<string>();
    for (const key of ['require', 'require-dev']) {
      if (data[key] && typeof data[key] === 'object') {
        Object.keys(data[key]).forEach((d) => deps.add(d));
      }
    }
    return [...deps];
  } catch {
    return [];
  }
}

/**
 * Parse dependencies from pyproject.toml content.
 * Handles PEP 621 [project] dependencies and [tool.poetry.dependencies].
 */
export function parsePyprojectToml(content: string): string[] {
  const deps = new Set<string>();
  const lines = content.split('\n');

  let inDependencies = false;
  let inOptionalGroup = false;
  let inPoetryDeps = false;
  let inPoetryDevDeps = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Track section headers
    if (trimmed === '[project]' || trimmed === '[package]') {
      inDependencies = false;
      inOptionalGroup = false;
      inPoetryDeps = false;
      inPoetryDevDeps = false;
      continue;
    }

    if (trimmed === '[tool.poetry.dependencies]') {
      inPoetryDeps = true;
      inPoetryDevDeps = false;
      inDependencies = false;
      inOptionalGroup = false;
      continue;
    }

    if (trimmed === '[tool.poetry.dev-dependencies]' || trimmed === '[tool.poetry.group.dev.dependencies]') {
      inPoetryDevDeps = true;
      inPoetryDeps = false;
      inDependencies = false;
      inOptionalGroup = false;
      continue;
    }

    if (/^\[project\.optional-dependencies/.test(trimmed)) {
      inOptionalGroup = true;
      inDependencies = false;
      inPoetryDeps = false;
      inPoetryDevDeps = false;
      continue;
    }

    // Any other section header resets state
    if (trimmed.startsWith('[')) {
      inDependencies = false;
      inOptionalGroup = false;
      inPoetryDeps = false;
      inPoetryDevDeps = false;
      continue;
    }

    // PEP 621: dependencies = ["flask>=2.0", "requests"]
    const depsArrayMatch = trimmed.match(/^dependencies\s*=\s*\[/);
    if (depsArrayMatch) {
      inDependencies = true;
      // Parse inline items on same line
      extractPep621Deps(trimmed, deps);
      if (trimmed.includes(']')) {
        inDependencies = false;
      }
      continue;
    }

    // Continuation of a dependencies array
    if (inDependencies || inOptionalGroup) {
      extractPep621Deps(trimmed, deps);
      if (trimmed.includes(']')) {
        inDependencies = false;
        inOptionalGroup = false;
      }
      continue;
    }

    // Optional dependency group values (e.g., dev = ["pytest", ...])
    if (inOptionalGroup) {
      extractPep621Deps(trimmed, deps);
      continue;
    }

    // Poetry-style: package-name = "^1.0" or package-name = {version = "^1.0", ...}
    if (inPoetryDeps || inPoetryDevDeps) {
      const poetryMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=/);
      if (poetryMatch && poetryMatch[1] !== 'python') {
        deps.add(poetryMatch[1]);
      }
    }
  }

  return [...deps];
}

/**
 * Extract PEP 621-style dependency names from a line containing quoted package specs.
 * E.g., "flask>=2.0" -> "flask", "requests[security]~=2.28" -> "requests"
 */
function extractPep621Deps(line: string, deps: Set<string>): void {
  const matches = line.matchAll(/["']([a-zA-Z0-9_][a-zA-Z0-9._-]*)/g);
  for (const match of matches) {
    // Strip extras like [security] — just get the base package name
    const name = match[1].split('[')[0];
    if (name) {
      deps.add(name);
    }
  }
}

/**
 * Route a manifest file to its appropriate parser.
 */
export function parseManifestContent(fileName: string, content: string): string[] {
  if (fileName === 'package.json') return parsePackageJson(content);
  if (fileName === 'requirements.txt' || fileName === 'Pipfile') return parseRequirementsTxt(content);
  if (fileName === 'Gemfile') return parseGemfile(content);
  if (fileName === 'go.mod') return parseGoMod(content);
  if (fileName === 'Cargo.toml') return parseCargoToml(content);
  if (fileName === 'composer.json') return parseComposerJson(content);
  if (fileName === 'pyproject.toml') return parsePyprojectToml(content);
  return [];
}

/**
 * Fetch and parse all detectable manifest files from a repository.
 */
export async function fetchAndParseManifests(
  repo: RepoInfo,
  fileTree: string[],
): Promise<ParsedDependencies[]> {
  const results: ParsedDependencies[] = [];

  const manifestsPresent = MANIFEST_FILES.filter((m) =>
    fileTree.some((f) => f === m || f.endsWith(`/${m}`)),
  );

  const fetches = manifestsPresent.map(async (fileName) => {
    const content = await fetchRawFile(rawUrl(repo, fileName));
    if (content) {
      const packages = parseManifestContent(fileName, content);
      if (packages.length > 0) {
        results.push({ source: fileName, packages });
      }
    }
  });

  await Promise.all(fetches);
  return results;
}
