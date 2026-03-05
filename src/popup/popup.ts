import { categorizeResults, confidenceLabel } from '../utils/categorizer';
import { isRepoPage } from '../utils/file-tree-parser';
import type { AnalysisResult, AnalysisError, DetectedTech } from '../utils/types';
import { CATEGORY_LABELS } from '../utils/constants';

const loadingEl = document.getElementById('loading')!;
const emptyStateEl = document.getElementById('empty-state')!;
const notGithubEl = document.getElementById('not-github')!;
const errorStateEl = document.getElementById('error-state')!;
const errorTextEl = document.getElementById('error-text')!;
const errorHintEl = document.getElementById('error-hint')!;
const retryBtnEl = document.getElementById('retry-btn')!;
const resultsEl = document.getElementById('results')!;
const repoNameEl = document.getElementById('repo-name')!;

function showSection(section: 'loading' | 'empty' | 'not-github' | 'error' | 'results') {
  loadingEl.classList.toggle('hidden', section !== 'loading');
  emptyStateEl.classList.toggle('hidden', section !== 'empty');
  notGithubEl.classList.toggle('hidden', section !== 'not-github');
  errorStateEl.classList.toggle('hidden', section !== 'error');
  resultsEl.classList.toggle('hidden', section !== 'results');
}

function showError(error: AnalysisError) {
  errorTextEl.textContent = error.message;

  switch (error.code) {
    case 'PRIVATE_REPO':
      errorHintEl.textContent = 'GitHub API authentication is not yet supported.';
      retryBtnEl.classList.add('hidden');
      break;
    case 'RATE_LIMITED':
      errorHintEl.textContent = 'Too many requests. Wait a moment and try again.';
      retryBtnEl.classList.remove('hidden');
      break;
    case 'NETWORK_ERROR':
      errorHintEl.textContent = 'Check your internet connection and try again.';
      retryBtnEl.classList.remove('hidden');
      break;
    case 'EMPTY_REPO':
      errorHintEl.textContent = 'This repository appears to be empty.';
      retryBtnEl.classList.add('hidden');
      break;
    default:
      errorHintEl.textContent = 'Something went wrong.';
      retryBtnEl.classList.remove('hidden');
      break;
  }

  showSection('error');
}

function getScoreClass(score: number): string {
  if (score >= 50) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
}

function renderSignals(tech: DetectedTech): string {
  return tech.signals
    .map((s) => {
      const icon = s.type === 'file' ? '&#128196;' : s.type === 'dependency' ? '&#128230;' : '&#128193;';
      return `<div class="signal-item"><span class="signal-icon">${icon}</span><span>${escapeHtml(s.detail)}</span></div>`;
    })
    .join('');
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderResults(result: AnalysisResult) {
  if (result.technologies.length === 0) {
    showSection('empty');
    return;
  }

  const categorized = categorizeResults(result.technologies);

  let html = '';
  for (const group of categorized) {
    const label = CATEGORY_LABELS[group.category] || group.category;
    html += `<div class="category-group">`;
    html += `<div class="category-label">${escapeHtml(label)}</div>`;

    for (const tech of group.technologies) {
      const scoreClass = getScoreClass(tech.score);
      const label = confidenceLabel(tech.score);
      const techId = `tech-${tech.tech.id}`;
      html += `
        <div class="tech-item" data-tech-id="${techId}">
          <div class="tech-header">
            <span class="expand-arrow" id="arrow-${techId}">&#9654;</span>
            <span class="tech-name">${escapeHtml(tech.tech.name)}</span>
            <span class="tech-score score-${scoreClass}">${label}</span>
          </div>
          <div class="confidence-bar">
            <div class="confidence-fill fill-${scoreClass}" style="width: ${tech.score}%"></div>
          </div>
          <div class="tech-signals hidden" id="signals-${techId}">
            ${renderSignals(tech)}
          </div>
        </div>
      `;
    }

    html += `</div>`;
  }

  resultsEl.innerHTML = html;
  showSection('results');

  // Add click handlers for expanding tech details
  resultsEl.querySelectorAll('.tech-item').forEach((item) => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-tech-id')!;
      const signals = document.getElementById(`signals-${id}`)!;
      const arrow = document.getElementById(`arrow-${id}`)!;
      signals.classList.toggle('hidden');
      arrow.classList.toggle('expanded');
    });
  });
}

async function init() {
  showSection('loading');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || !isRepoPage(tab.url)) {
      showSection('not-github');
      return;
    }

    // Display repo name
    const urlMatch = tab.url.match(/github\.com\/([^/]+\/[^/]+)/);
    if (urlMatch) {
      repoNameEl.textContent = urlMatch[1];
    }

    // First try to get cached result
    const cached = await chrome.runtime.sendMessage({
      type: 'GET_CACHED_RESULT',
      repoUrl: tab.url,
    });

    if (cached?.result) {
      renderResults(cached.result);
      return;
    }

    // Inject script to get file tree from the active tab
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: () => {
        // Re-implement parsing inline since we're in the page context
        const files: string[] = [];
        const selectors = [
          '[role="grid"] [role="rowheader"] a',
          '[role="grid"] [role="row"] a.Link--primary',
          '[data-testid="listRow-name-text"] a',
          'div[role="grid"] div[role="row"] div[role="gridcell"] a.js-navigation-open',
        ];
        for (const selector of selectors) {
          const links = document.querySelectorAll(selector);
          if (links.length > 0) {
            links.forEach((link) => {
              const name = link.textContent?.trim();
              if (name && name !== '..' && name !== '.') files.push(name);
            });
            break;
          }
        }
        // Also get directories
        document.querySelectorAll('a[href*="/tree/"]').forEach((link) => {
          const name = link.textContent?.trim();
          if (name && !name.includes('/') && !files.includes(name)) {
            files.push(name);
          }
        });
        return files;
      },
    });

    const fileTree = results?.[0]?.result as string[] | undefined;
    if (!fileTree || fileTree.length === 0) {
      showSection('empty');
      return;
    }

    // Send to background for analysis
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_REPO',
      repoUrl: tab.url,
      fileTree,
    });

    if (response?.type === 'ANALYSIS_ERROR' && response.error) {
      showError(response.error);
    } else if (response?.type === 'ANALYSIS_RESULT' && response.result) {
      renderResults(response.result);
    } else {
      showSection('empty');
    }
  } catch (error) {
    console.error('GitHub Stack Analyzer error:', error);
    showError({
      code: 'UNKNOWN_ERROR',
      message: 'Failed to analyze repository.',
      retryable: true,
    });
  }
}

// Detect GitHub's theme from the active tab and apply it to popup
async function detectTheme() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.includes('github.com')) return;

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const html = document.documentElement;
        return html.getAttribute('data-color-mode') || null;
      },
    });

    const colorMode = results?.[0]?.result as string | null;
    if (colorMode === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch {
    // Theme detection is optional, fail silently
  }
}

// Retry button handler
retryBtnEl.addEventListener('click', () => {
  init();
});

detectTheme();
init();
