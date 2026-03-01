import { describe, it, expect } from 'vitest';
import { matchTechnologies } from '../src/utils/pattern-matcher';
import type { TechFingerprint, ParsedDependencies } from '../src/utils/types';

const mockFingerprint: TechFingerprint = {
  id: 'react',
  name: 'React',
  category: 'framework',
  patterns: {
    files: ['*.jsx', '*.tsx'],
    directories: ['components'],
    dependencies: [{ source: 'package.json', packages: ['react', 'react-dom'] }],
  },
  confidence: { fileMatch: 8, depMatch: 10, contentMatch: 3 },
};

const typescriptFp: TechFingerprint = {
  id: 'typescript',
  name: 'TypeScript',
  category: 'language',
  patterns: {
    files: ['*.ts', '*.tsx', 'tsconfig.json'],
    dependencies: [{ source: 'package.json', packages: ['typescript'] }],
  },
  confidence: { fileMatch: 8, depMatch: 10, contentMatch: 3 },
};

const dockerFp: TechFingerprint = {
  id: 'docker',
  name: 'Docker',
  category: 'devops',
  patterns: {
    files: ['Dockerfile', 'docker-compose.yml', '.dockerignore'],
  },
  confidence: { fileMatch: 10, depMatch: 0, contentMatch: 3 },
};

describe('matchTechnologies', () => {
  it('detects technologies from file patterns', () => {
    const fileTree = ['App.tsx', 'index.ts', 'README.md'];
    const result = matchTechnologies(fileTree, [], [mockFingerprint]);

    expect(result).toHaveLength(1);
    expect(result[0].tech.id).toBe('react');
    expect(result[0].signals.some((s) => s.type === 'file')).toBe(true);
  });

  it('detects technologies from directory patterns', () => {
    const fileTree = ['components', 'src', 'package.json'];
    const result = matchTechnologies(fileTree, [], [mockFingerprint]);

    expect(result).toHaveLength(1);
    expect(result[0].signals.some((s) => s.type === 'directory')).toBe(true);
  });

  it('detects technologies from dependency patterns', () => {
    const deps: ParsedDependencies[] = [
      { source: 'package.json', packages: ['react', 'react-dom', 'axios'] },
    ];
    const result = matchTechnologies([], deps, [mockFingerprint]);

    expect(result).toHaveLength(1);
    expect(result[0].tech.id).toBe('react');
    expect(result[0].signals.filter((s) => s.type === 'dependency')).toHaveLength(2);
  });

  it('returns empty array when no match', () => {
    const fileTree = ['main.py', 'requirements.txt'];
    const result = matchTechnologies(fileTree, [], [mockFingerprint]);

    expect(result).toHaveLength(0);
  });

  it('detects multiple technologies', () => {
    const fileTree = ['App.tsx', 'tsconfig.json', 'Dockerfile'];
    const deps: ParsedDependencies[] = [
      { source: 'package.json', packages: ['react', 'typescript'] },
    ];
    const result = matchTechnologies(fileTree, deps, [mockFingerprint, typescriptFp, dockerFp]);

    expect(result).toHaveLength(3);
    const ids = result.map((r) => r.tech.id).sort();
    expect(ids).toEqual(['docker', 'react', 'typescript']);
  });

  it('calculates confidence score based on signal weights', () => {
    const fileTree = ['App.tsx', 'Component.jsx'];
    const deps: ParsedDependencies[] = [
      { source: 'package.json', packages: ['react', 'react-dom'] },
    ];
    const result = matchTechnologies(fileTree, deps, [mockFingerprint]);

    expect(result).toHaveLength(1);
    expect(result[0].score).toBeGreaterThan(0);
    expect(result[0].score).toBeLessThanOrEqual(100);
  });

  it('caps confidence score at 100', () => {
    // Create many matching files and deps
    const fileTree = Array.from({ length: 20 }, (_, i) => `file${i}.tsx`);
    const deps: ParsedDependencies[] = [
      { source: 'package.json', packages: ['react', 'react-dom'] },
    ];
    const result = matchTechnologies(fileTree, deps, [mockFingerprint]);

    expect(result[0].score).toBeLessThanOrEqual(100);
  });

  it('handles file paths with directories', () => {
    const fileTree = ['src/App.tsx', 'src/components/Button.jsx'];
    const result = matchTechnologies(fileTree, [], [mockFingerprint]);

    expect(result).toHaveLength(1);
    expect(result[0].tech.id).toBe('react');
  });

  it('handles empty fingerprints array', () => {
    const result = matchTechnologies(['file.ts'], [], []);
    expect(result).toHaveLength(0);
  });
});
