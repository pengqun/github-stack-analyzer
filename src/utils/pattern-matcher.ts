import type { TechFingerprint, DetectedTech, Signal, ParsedDependencies } from './types';

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
 * Run all fingerprints against the file tree and parsed dependencies.
 * Returns technologies that matched with at least one signal.
 */
export function matchTechnologies(
  fileTree: string[],
  parsedDeps: ParsedDependencies[],
  fingerprints: TechFingerprint[],
): DetectedTech[] {
  const results: DetectedTech[] = [];

  for (const fp of fingerprints) {
    const fileSignals = matchFiles(fileTree, fp);
    const dirSignals = matchDirectories(fileTree, fp);
    const depSignals = matchDependencies(parsedDeps, fp);
    const allSignals = [...fileSignals, ...dirSignals, ...depSignals];

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
    score = Math.min(score, 100);

    results.push({
      tech: fp,
      score,
      signals: allSignals,
    });
  }

  return results;
}
