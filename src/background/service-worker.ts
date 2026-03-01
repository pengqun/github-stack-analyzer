import { matchTechnologies } from '../utils/pattern-matcher';
import { categorizeResults } from '../utils/categorizer';
import { fetchAndParseManifests } from '../utils/manifest-parser';
import { parseRepoUrl } from '../utils/file-tree-parser';
import fingerprints from '../data/fingerprints.json';
import type { TechFingerprint, AnalysisResult } from '../utils/types';
import { CACHE_TTL_MS } from '../utils/constants';

const typedFingerprints = fingerprints as TechFingerprint[];

interface CacheEntry {
  result: AnalysisResult;
  timestamp: number;
}

async function getCachedResult(repoUrl: string): Promise<AnalysisResult | null> {
  try {
    const data = await chrome.storage.local.get(repoUrl);
    const entry = data[repoUrl] as CacheEntry | undefined;
    if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return entry.result;
    }
  } catch {
    // Storage may be unavailable
  }
  return null;
}

async function setCachedResult(repoUrl: string, result: AnalysisResult): Promise<void> {
  try {
    const entry: CacheEntry = { result, timestamp: Date.now() };
    await chrome.storage.local.set({ [repoUrl]: entry });
  } catch {
    // Storage may be unavailable
  }
}

async function analyzeRepo(repoUrl: string, fileTree: string[]): Promise<AnalysisResult> {
  // Check cache first
  const cached = await getCachedResult(repoUrl);
  if (cached) return cached;

  const repoInfo = parseRepoUrl(repoUrl);

  // Parse dependency manifests if we can identify the repo
  const parsedDeps = repoInfo ? await fetchAndParseManifests(repoInfo, fileTree) : [];

  // Run pattern matching
  const detected = matchTechnologies(fileTree, parsedDeps, typedFingerprints);

  // Categorize results
  const categorized = categorizeResults(detected);
  const sortedTechs = categorized.flatMap((c) => c.technologies);

  const result: AnalysisResult = {
    repoUrl,
    analyzedAt: Date.now(),
    technologies: sortedTechs,
    fileTree,
  };

  // Cache the result
  await setCachedResult(repoUrl, result);

  return result;
}

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ANALYZE_REPO') {
    analyzeRepo(message.repoUrl, message.fileTree)
      .then((result) => {
        sendResponse({ type: 'ANALYSIS_RESULT', result });
      })
      .catch((error) => {
        sendResponse({
          type: 'ANALYSIS_ERROR',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    return true; // Keep message channel open for async response
  }

  if (message.type === 'GET_CACHED_RESULT') {
    getCachedResult(message.repoUrl)
      .then((result) => {
        sendResponse({ type: 'ANALYSIS_RESULT', result });
      })
      .catch(() => {
        sendResponse({ type: 'ANALYSIS_RESULT', result: null });
      });
    return true;
  }
});
