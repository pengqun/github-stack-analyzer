import { describe, it, expect } from 'vitest';
import { matchTechnologies } from '../../src/utils/pattern-matcher';
import { categorizeResults, confidenceLabel } from '../../src/utils/categorizer';
import {
  parsePackageJson,
  parseRequirementsTxt,
  parseGoMod,
  parseManifestContent,
} from '../../src/utils/manifest-parser';
import type { ParsedDependencies } from '../../src/utils/types';
import fingerprints from '../../src/data/fingerprints.json';
import type { TechFingerprint } from '../../src/utils/types';

const allFingerprints = fingerprints as TechFingerprint[];

describe('Analysis Pipeline Integration', () => {
  describe('React + TypeScript + Vite project', () => {
    const fileTree = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'src/App.tsx',
      'src/main.tsx',
      'src/index.css',
      'src/components/Header.tsx',
      'README.md',
      '.gitignore',
      '.eslintrc.cjs',
      '.prettierrc',
    ];

    const packageJsonContent = JSON.stringify({
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      },
      devDependencies: {
        typescript: '^5.3.0',
        vite: '^5.1.0',
        eslint: '^8.56.0',
        prettier: '^3.2.0',
        vitest: '^1.3.0',
      },
    });

    const deps: ParsedDependencies[] = [
      { source: 'package.json', packages: parsePackageJson(packageJsonContent) },
    ];

    it('detects React, TypeScript, Vite, ESLint, Prettier, and Vitest', () => {
      const detected = matchTechnologies(fileTree, deps, allFingerprints);
      const ids = detected.map((d) => d.tech.id);

      expect(ids).toContain('react');
      expect(ids).toContain('typescript');
      expect(ids).toContain('vite');
      expect(ids).toContain('eslint');
      expect(ids).toContain('prettier');
      expect(ids).toContain('vitest');
    });

    it('categorizes results correctly', () => {
      const detected = matchTechnologies(fileTree, deps, allFingerprints);
      const categorized = categorizeResults(detected);
      const categories = categorized.map((c) => c.category);

      expect(categories).toContain('framework');
      expect(categories).toContain('language');
      expect(categories).toContain('build-tool');
    });

    it('assigns reasonable confidence scores', () => {
      const detected = matchTechnologies(fileTree, deps, allFingerprints);
      const react = detected.find((d) => d.tech.id === 'react')!;

      // React should have high confidence (file + dep matches)
      expect(react.score).toBeGreaterThanOrEqual(20);
      expect(confidenceLabel(react.score)).not.toBe('Trace');
    });
  });

  describe('Python Django project', () => {
    const fileTree = [
      'manage.py',
      'requirements.txt',
      'myapp/settings.py',
      'myapp/urls.py',
      'myapp/wsgi.py',
      'myapp/asgi.py',
      'templates',
      'Dockerfile',
      'docker-compose.yml',
      '.github/workflows',
    ];

    const requirementsContent = [
      'django==4.2.0',
      'djangorestframework==3.14.0',
      'psycopg2-binary==2.9.5',
      'redis==4.5.0',
      'pytest==7.3.0',
    ].join('\n');

    const deps: ParsedDependencies[] = [
      { source: 'requirements.txt', packages: parseRequirementsTxt(requirementsContent) },
    ];

    it('detects Django, Python, Docker, PostgreSQL, Redis, Pytest', () => {
      const detected = matchTechnologies(fileTree, deps, allFingerprints);
      const ids = detected.map((d) => d.tech.id);

      expect(ids).toContain('django');
      expect(ids).toContain('python');
      expect(ids).toContain('docker');
      expect(ids).toContain('postgresql');
      expect(ids).toContain('redis');
      expect(ids).toContain('pytest');
    });

    it('detects GitHub Actions from directory', () => {
      const detected = matchTechnologies(fileTree, deps, allFingerprints);
      const ids = detected.map((d) => d.tech.id);
      expect(ids).toContain('github-actions');
    });
  });

  describe('Go project', () => {
    const fileTree = ['main.go', 'go.mod', 'go.sum', 'cmd/server/main.go', 'Dockerfile'];

    const goModContent = [
      'module github.com/example/myapp',
      '',
      'go 1.21',
      '',
      'require (',
      '\tgithub.com/gin-gonic/gin v1.9.0',
      '\tgithub.com/go-redis/redis/v9 v9.0.0',
      ')',
    ].join('\n');

    const deps: ParsedDependencies[] = [
      { source: 'go.mod', packages: parseGoMod(goModContent) },
    ];

    it('detects Go and Docker', () => {
      const detected = matchTechnologies(fileTree, deps, allFingerprints);
      const ids = detected.map((d) => d.tech.id);

      expect(ids).toContain('go');
      expect(ids).toContain('docker');
    });

    it('does not falsely detect JavaScript frameworks', () => {
      const detected = matchTechnologies(fileTree, deps, allFingerprints);
      const ids = detected.map((d) => d.tech.id);

      expect(ids).not.toContain('react');
      expect(ids).not.toContain('vue');
      expect(ids).not.toContain('angular');
    });
  });

  describe('Empty file tree', () => {
    it('returns no technologies', () => {
      const detected = matchTechnologies([], [], allFingerprints);
      expect(detected).toHaveLength(0);
    });

    it('categorizes to empty array', () => {
      const categorized = categorizeResults([]);
      expect(categorized).toHaveLength(0);
    });
  });

  describe('Minimal project (few files)', () => {
    const fileTree = ['README.md', 'LICENSE'];

    it('returns no technologies', () => {
      const detected = matchTechnologies(fileTree, [], allFingerprints);
      expect(detected).toHaveLength(0);
    });
  });

  describe('Manifest parsing pipeline', () => {
    it('routes package.json correctly', () => {
      const content = JSON.stringify({ dependencies: { express: '^4.18.0' } });
      const packages = parseManifestContent('package.json', content);
      expect(packages).toContain('express');
    });

    it('routes requirements.txt correctly', () => {
      const packages = parseManifestContent('requirements.txt', 'flask==2.0.0\nrequests>=2.28');
      expect(packages).toContain('flask');
      expect(packages).toContain('requests');
    });

    it('routes go.mod correctly', () => {
      const content = 'module example\n\ngo 1.21\n\nrequire github.com/gin-gonic/gin v1.9.0\n';
      const packages = parseManifestContent('go.mod', content);
      expect(packages).toContain('github.com/gin-gonic/gin');
    });

    it('returns empty for unknown manifest', () => {
      const packages = parseManifestContent('unknown.txt', 'some content');
      expect(packages).toHaveLength(0);
    });
  });
});
