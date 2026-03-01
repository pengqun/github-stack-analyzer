import { describe, it, expect } from 'vitest';
import { parseRepoUrl, isRepoPage } from '../src/utils/file-tree-parser';

describe('parseRepoUrl', () => {
  it('parses standard GitHub repo URL', () => {
    const result = parseRepoUrl('https://github.com/facebook/react');

    expect(result).not.toBeNull();
    expect(result!.owner).toBe('facebook');
    expect(result!.repo).toBe('react');
    expect(result!.branch).toBe('main');
  });

  it('parses repo URL with branch', () => {
    const result = parseRepoUrl('https://github.com/facebook/react/tree/v18.2.0');

    expect(result).not.toBeNull();
    expect(result!.owner).toBe('facebook');
    expect(result!.repo).toBe('react');
    expect(result!.branch).toBe('v18.2.0');
  });

  it('strips .git suffix', () => {
    const result = parseRepoUrl('https://github.com/user/repo.git');

    expect(result).not.toBeNull();
    expect(result!.repo).toBe('repo');
  });

  it('returns null for non-GitHub URL', () => {
    expect(parseRepoUrl('https://gitlab.com/user/repo')).toBeNull();
  });

  it('returns null for invalid URL', () => {
    expect(parseRepoUrl('not-a-url')).toBeNull();
  });
});

describe('isRepoPage', () => {
  it('matches repo root page', () => {
    expect(isRepoPage('https://github.com/facebook/react')).toBe(true);
  });

  it('matches repo tree page', () => {
    expect(isRepoPage('https://github.com/facebook/react/tree/main')).toBe(true);
  });

  it('matches repo subdirectory', () => {
    expect(isRepoPage('https://github.com/facebook/react/tree/main/src')).toBe(true);
  });

  it('rejects non-repo GitHub pages', () => {
    expect(isRepoPage('https://github.com/facebook')).toBe(false);
  });

  it('rejects blob (file) pages', () => {
    expect(isRepoPage('https://github.com/facebook/react/blob/main/README.md')).toBe(false);
  });

  it('rejects non-GitHub URLs', () => {
    expect(isRepoPage('https://example.com/user/repo')).toBe(false);
  });
});
