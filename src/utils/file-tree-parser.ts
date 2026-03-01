import type { RepoInfo } from './types';

/**
 * Extract repository owner/name/branch from a GitHub URL.
 */
export function parseRepoUrl(url: string): RepoInfo | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  const owner = match[1];
  const repo = match[2].replace(/\.git$/, '');
  const branchMatch = url.match(/\/tree\/([^/]+)/);
  const branch = branchMatch ? branchMatch[1] : 'main';
  return { owner, repo, branch };
}

/**
 * Parse the GitHub repository page DOM to extract file and directory names.
 * Targets the file explorer table rendered on repository root/directory pages.
 */
export function parseFileTreeFromDOM(doc: Document): string[] {
  const files: string[] = [];

  // Strategy 1: Modern GitHub (react-based file tree)
  // Look for role="rowheader" links inside the file tree grid
  const rowHeaders = doc.querySelectorAll(
    '[role="grid"] [role="rowheader"] a, [role="grid"] [role="row"] a.Link--primary',
  );
  if (rowHeaders.length > 0) {
    rowHeaders.forEach((link) => {
      const name = link.textContent?.trim();
      if (name && name !== '..' && name !== '.') {
        files.push(name);
      }
    });
    return files;
  }

  // Strategy 2: GitHub file tree with data-testid
  const testIdLinks = doc.querySelectorAll('[data-testid="listRow-name-text"] a');
  if (testIdLinks.length > 0) {
    testIdLinks.forEach((link) => {
      const name = link.textContent?.trim();
      if (name && name !== '..' && name !== '.') {
        files.push(name);
      }
    });
    return files;
  }

  // Strategy 3: Classic GitHub DOM structure
  const classicLinks = doc.querySelectorAll(
    'div[role="grid"] div[role="row"] div[role="gridcell"] a.js-navigation-open',
  );
  if (classicLinks.length > 0) {
    classicLinks.forEach((link) => {
      const name = link.textContent?.trim();
      if (name && name !== '..' && name !== '.') {
        files.push(name);
      }
    });
    return files;
  }

  // Strategy 4: Fallback — look for any navigation links in the file tree area
  const treeItems = doc.querySelectorAll('.react-directory-row a, .js-navigation-item a');
  treeItems.forEach((link) => {
    const name = link.textContent?.trim();
    if (name && name !== '..' && name !== '.' && !name.includes('/')) {
      files.push(name);
    }
  });

  return [...new Set(files)];
}

/**
 * Check if the current page is a GitHub repository root or directory page.
 */
export function isRepoPage(url: string): boolean {
  const repoPattern = /^https:\/\/github\.com\/[^/]+\/[^/]+(\/tree\/[^/]+(\/.*)?)?$/;
  return repoPattern.test(url);
}

/**
 * Determine if a file name looks like a directory (heuristic based on GitHub rendering).
 * On GitHub, directories are links that navigate to /tree/ paths.
 */
export function extractDirectoriesFromDOM(doc: Document): string[] {
  const dirs: string[] = [];
  const links = doc.querySelectorAll('a[href*="/tree/"]');
  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const name = link.textContent?.trim();
    if (name && href.includes('/tree/') && !name.includes('/')) {
      dirs.push(name);
    }
  });
  return [...new Set(dirs)];
}
