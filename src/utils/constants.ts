export const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';

export const MANIFEST_FILES = [
  'package.json',
  'requirements.txt',
  'Pipfile',
  'setup.py',
  'pyproject.toml',
  'Gemfile',
  'go.mod',
  'Cargo.toml',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'composer.json',
  'pubspec.yaml',
  'Package.swift',
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  language: 'Languages',
  framework: 'Frameworks',
  library: 'Libraries',
  database: 'Databases',
  devops: 'DevOps & CI/CD',
  testing: 'Testing',
  styling: 'Styling',
  'build-tool': 'Build Tools',
  infrastructure: 'Infrastructure',
  other: 'Other',
};

export const CATEGORY_ORDER = [
  'language',
  'framework',
  'library',
  'styling',
  'testing',
  'build-tool',
  'database',
  'devops',
  'infrastructure',
  'other',
] as const;
