import { describe, it, expect } from 'vitest';
import {
  parsePackageJson,
  parseRequirementsTxt,
  parseGemfile,
  parseGoMod,
  parseCargoToml,
  parseComposerJson,
  parseManifestContent,
} from '../src/utils/manifest-parser';

describe('parsePackageJson', () => {
  it('extracts all dependency types', () => {
    const content = JSON.stringify({
      dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
      devDependencies: { typescript: '^5.0.0', vitest: '^1.0.0' },
      peerDependencies: { 'react-native': '*' },
    });
    const deps = parsePackageJson(content);

    expect(deps).toContain('react');
    expect(deps).toContain('react-dom');
    expect(deps).toContain('typescript');
    expect(deps).toContain('vitest');
    expect(deps).toContain('react-native');
  });

  it('handles package.json with no dependencies', () => {
    const content = JSON.stringify({ name: 'test', version: '1.0.0' });
    expect(parsePackageJson(content)).toEqual([]);
  });

  it('handles invalid JSON', () => {
    expect(parsePackageJson('not json')).toEqual([]);
  });

  it('deduplicates across dependency types', () => {
    const content = JSON.stringify({
      dependencies: { lodash: '^4.0.0' },
      devDependencies: { lodash: '^4.0.0' },
    });
    const deps = parsePackageJson(content);
    expect(deps.filter((d) => d === 'lodash')).toHaveLength(1);
  });
});

describe('parseRequirementsTxt', () => {
  it('parses standard requirements', () => {
    const content = 'flask==2.0.0\ndjango>=4.0\nnumpy\nrequests~=2.28.0';
    const deps = parseRequirementsTxt(content);

    expect(deps).toContain('flask');
    expect(deps).toContain('django');
    expect(deps).toContain('numpy');
    expect(deps).toContain('requests');
  });

  it('ignores comments and blank lines', () => {
    const content = '# This is a comment\n\nflask==2.0.0\n  # Another comment';
    const deps = parseRequirementsTxt(content);

    expect(deps).toEqual(['flask']);
  });

  it('ignores -r and -e flags', () => {
    const content = '-r base.txt\n-e git+https://...\nflask==2.0.0';
    const deps = parseRequirementsTxt(content);

    expect(deps).toEqual(['flask']);
  });

  it('handles extras brackets', () => {
    const content = 'celery[redis]>=5.0.0';
    const deps = parseRequirementsTxt(content);

    expect(deps).toContain('celery');
  });
});

describe('parseGemfile', () => {
  it('parses gem declarations', () => {
    const content = `
source 'https://rubygems.org'
gem 'rails', '~> 7.0'
gem 'pg'
gem 'puma', '>= 5.0'
    `;
    const deps = parseGemfile(content);

    expect(deps).toContain('rails');
    expect(deps).toContain('pg');
    expect(deps).toContain('puma');
    expect(deps).toHaveLength(3);
  });

  it('handles double-quoted gems', () => {
    const content = 'gem "sidekiq"';
    const deps = parseGemfile(content);
    expect(deps).toContain('sidekiq');
  });
});

describe('parseGoMod', () => {
  it('parses require block', () => {
    const content = `
module example.com/myproject

go 1.21

require (
\tgithub.com/gin-gonic/gin v1.9.0
\tgithub.com/lib/pq v1.10.9
)
    `;
    const deps = parseGoMod(content);

    expect(deps).toContain('github.com/gin-gonic/gin');
    expect(deps).toContain('github.com/lib/pq');
  });

  it('parses single require statement', () => {
    const content = `
module example.com/myproject

require github.com/gin-gonic/gin v1.9.0
    `;
    const deps = parseGoMod(content);
    expect(deps).toContain('github.com/gin-gonic/gin');
  });
});

describe('parseCargoToml', () => {
  it('parses dependencies section', () => {
    const content = `
[package]
name = "myproject"
version = "0.1.0"

[dependencies]
serde = "1.0"
tokio = { version = "1", features = ["full"] }
reqwest = "0.11"

[dev-dependencies]
criterion = "0.5"
    `;
    const deps = parseCargoToml(content);

    expect(deps).toContain('serde');
    expect(deps).toContain('tokio');
    expect(deps).toContain('reqwest');
    expect(deps).toContain('criterion');
  });
});

describe('parseComposerJson', () => {
  it('parses require and require-dev', () => {
    const content = JSON.stringify({
      require: { 'laravel/framework': '^10.0', 'guzzlehttp/guzzle': '^7.2' },
      'require-dev': { 'phpunit/phpunit': '^10.0' },
    });
    const deps = parseComposerJson(content);

    expect(deps).toContain('laravel/framework');
    expect(deps).toContain('guzzlehttp/guzzle');
    expect(deps).toContain('phpunit/phpunit');
  });

  it('handles invalid JSON', () => {
    expect(parseComposerJson('invalid')).toEqual([]);
  });
});

describe('parseManifestContent', () => {
  it('routes to correct parser based on filename', () => {
    expect(parseManifestContent('package.json', '{"dependencies":{"react":"^18"}}')).toContain(
      'react',
    );
    expect(parseManifestContent('requirements.txt', 'flask==2.0')).toContain('flask');
    expect(parseManifestContent('Gemfile', "gem 'rails'")).toContain('rails');
    expect(
      parseManifestContent('go.mod', 'require github.com/gin-gonic/gin v1.0'),
    ).toContain('github.com/gin-gonic/gin');
  });

  it('returns empty array for unknown manifest type', () => {
    expect(parseManifestContent('unknown.txt', 'content')).toEqual([]);
  });
});
