import type { TechFingerprint, DetectedTech, Signal, ParsedDependencies, ContentPattern } from './types';

/**
 * Convert a simple glob pattern (e.g., "*.ts", "next.config.*") to a RegExp.
 * Supports * as wildcard. Does NOT support full glob syntax (**, ?).
 */
function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
}

/**
 * Check if a file name matches any of the given glob patterns.
 */
function matchesFilePattern(fileName: string, patterns: string[]): string | null {
  for (const pattern of patterns) {
    if (globToRegex(pattern).test(fileName)) {
      return pattern;
    }
  }
  return null;
}

/**
 * Match file tree entries against a single tech fingerprint's file patterns.
 */
function matchFiles(
  fileTree: string[],
  fingerprint: TechFingerprint,
): Signal[] {
  const signals: Signal[] = [];
  const filePatterns = fingerprint.patterns.files;
  if (!filePatterns || filePatterns.length === 0) return signals;

  for (const file of fileTree) {
    const baseName = file.includes('/') ? file.split('/').pop()! : file;
    const matched = matchesFilePattern(baseName, filePatterns);
    if (matched) {
      signals.push({
        type: 'file',
        source: file,
        detail: `File "${file}" matches pattern "${matched}"`,
      });
    }
  }
  return signals;
}

/**
 * Match directory names against a fingerprint's directory patterns.
 */
function matchDirectories(
  fileTree: string[],
  fingerprint: TechFingerprint,
): Signal[] {
  const signals: Signal[] = [];
  const dirPatterns = fingerprint.patterns.directories;
  if (!dirPatterns || dirPatterns.length === 0) return signals;

  for (const dir of dirPatterns) {
    const found = fileTree.some(
      (f) => f === dir || f.startsWith(`${dir}/`) || f.endsWith(`/${dir}`),
    );
    if (found) {
      signals.push({
        type: 'directory',
        source: dir,
        detail: `Directory "${dir}" found in repository`,
      });
    }
  }
  return signals;
}

/**
 * Match parsed dependencies against a fingerprint's dependency patterns.
 */
function matchDependencies(
  parsedDeps: ParsedDependencies[],
  fingerprint: TechFingerprint,
): Signal[] {
  const signals: Signal[] = [];
  const depPatterns = fingerprint.patterns.dependencies;
  if (!depPatterns || depPatterns.length === 0) return signals;

  for (const depPattern of depPatterns) {
    const manifest = parsedDeps.find((d) => d.source === depPattern.source);
    if (!manifest) continue;

    for (const pkg of depPattern.packages) {
      if (manifest.packages.includes(pkg)) {
        signals.push({
          type: 'dependency',
          source: depPattern.source,
          detail: `Package "${pkg}" found in ${depPattern.source}`,
        });
      }
    }
  }
  return signals;
}

/**
 * Match file contents against a fingerprint's content patterns.
 * fileContents maps file paths to their text content.
 */
function matchContents(
  fileContents: Map<string, string>,
  fingerprint: TechFingerprint,
): Signal[] {
  const signals: Signal[] = [];
  const contentPatterns: ContentPattern[] = fingerprint.patterns.contents || [];
  if (contentPatterns.length === 0) return signals;

  for (const cp of contentPatterns) {
    // Find matching files by glob pattern
    const regex = globToRegex(cp.file);
    for (const [filePath, content] of fileContents) {
      const baseName = filePath.includes('/') ? filePath.split('/').pop()! : filePath;
      if (!regex.test(baseName)) continue;

      try {
        const pattern = new RegExp(cp.pattern);
        if (pattern.test(content)) {
          signals.push({
            type: 'content',
            source: filePath,
            detail: `Content pattern "${cp.pattern}" matched in "${filePath}"`,
          });
        }
      } catch {
        // Invalid regex pattern, skip
      }
    }
  }
  return signals;
}

/**
 * Run all fingerprints against the file tree, parsed dependencies, and optionally file contents.
 * Returns technologies that matched with at least one signal.
 */
export function matchTechnologies(
  fileTree: string[],
  parsedDeps: ParsedDependencies[],
  fingerprints: TechFingerprint[],
  fileContents?: Map<string, string>,
): DetectedTech[] {
  const results: DetectedTech[] = [];
  const contents = fileContents || new Map<string, string>();

  for (const fp of fingerprints) {
    const fileSignals = matchFiles(fileTree, fp);
    const dirSignals = matchDirectories(fileTree, fp);
    const depSignals = matchDependencies(parsedDeps, fp);
    const contentSignals = matchContents(contents, fp);
    const allSignals = [...fileSignals, ...dirSignals, ...depSignals, ...contentSignals];

    if (allSignals.length === 0) continue;

    // Calculate confidence score (0–100)
    let score = 0;
    if (fileSignals.length > 0) {
      score += Math.min(fileSignals.length * fp.confidence.fileMatch, 40);
    }
    if (dirSignals.length > 0) {
      score += Math.min(dirSignals.length * fp.confidence.fileMatch, 20);
    }
    if (depSignals.length > 0) {
      score += Math.min(depSignals.length * fp.confidence.depMatch, 40);
    }
    if (contentSignals.length > 0) {
      score += Math.min(contentSignals.length * fp.confidence.contentMatch, 20);
    }
    score = Math.min(score, 100);

    results.push({
      tech: fp,
      score,
      signals: allSignals,
    });
  }

  return results;
}
