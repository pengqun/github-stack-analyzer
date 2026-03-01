import { parseFileTreeFromDOM, isRepoPage, extractDirectoriesFromDOM } from '../utils/file-tree-parser';
import type { AnalysisResult } from '../utils/types';

const BADGE_ID = 'gsa-tech-badge';

function createBadge(count: number): HTMLElement {
  let badge = document.getElementById(BADGE_ID);
  if (badge) {
    badge.textContent = `${count} tech${count !== 1 ? 's' : ''} detected`;
    return badge;
  }

  badge = document.createElement('div');
  badge.id = BADGE_ID;
  badge.textContent = `${count} tech${count !== 1 ? 's' : ''} detected`;
  badge.title = 'Click to open GitHub Stack Analyzer';
  badge.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
  });

  return badge;
}

function removeBadge(): void {
  const badge = document.getElementById(BADGE_ID);
  if (badge) badge.remove();
}

function injectBadge(result: AnalysisResult): void {
  if (result.technologies.length === 0) {
    removeBadge();
    return;
  }

  const badge = createBadge(result.technologies.length);

  // Try to inject near the repo header
  const repoHeader =
    document.querySelector('.AppHeader-context-full') ||
    document.querySelector('[class*="repository-content"]') ||
    document.querySelector('#repository-container-header') ||
    document.querySelector('.pagehead');

  if (repoHeader && !document.getElementById(BADGE_ID)) {
    repoHeader.appendChild(badge);
  } else if (!document.getElementById(BADGE_ID)) {
    document.body.appendChild(badge);
  }
}

function analyze(): void {
  const url = window.location.href;
  if (!isRepoPage(url)) {
    removeBadge();
    return;
  }

  const fileTree = parseFileTreeFromDOM(document);
  const directories = extractDirectoriesFromDOM(document);
  const allEntries = [...new Set([...fileTree, ...directories])];

  if (allEntries.length === 0) return;

  chrome.runtime.sendMessage(
    { type: 'ANALYZE_REPO', repoUrl: url, fileTree: allEntries },
    (response) => {
      if (response?.type === 'ANALYSIS_RESULT' && response.result) {
        injectBadge(response.result);
      }
    },
  );
}

// Run analysis on page load
analyze();

// Re-analyze on GitHub's soft navigation (SPA-style page transitions)
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    setTimeout(analyze, 500); // Give DOM time to update
  }
});

observer.observe(document.body, { childList: true, subtree: true });
